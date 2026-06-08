# Example Code Snippets for Invoice Generator

## Backend Examples

### 1. User Model with Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  password              String
  firstName             String?
  lastName              String?
  company               String?
  phone                 String?
  address               Json?
  subscription          SubscriptionType @default(FREE)
  subscriptionExpiry    DateTime?
  invoiceCount          Int      @default(0)
  monthlyInvoiceCount   Int      @default(0)
  lastInvoiceReset      DateTime @default(now())
  stripeCustomerId      String?
  isActive              Boolean  @default(true)
  emailVerified         Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  invoices              Invoice[]
  subscriptions         Subscription[]

  @@map("users")
}

model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique
  userId        String
  clientName    String
  clientEmail   String?
  clientAddress Json?
  items         Json[]
  subtotal      Decimal       @db.Decimal(10, 2)
  taxRate       Decimal       @default(0) @db.Decimal(5, 2)
  taxAmount     Decimal       @default(0) @db.Decimal(10, 2)
  discount      Decimal       @default(0) @db.Decimal(10, 2)
  total         Decimal       @db.Decimal(10, 2)
  currency      String        @default("USD")
  status        InvoiceStatus @default(DRAFT)
  issueDate     DateTime
  dueDate       DateTime
  paidDate      DateTime?
  notes         String?
  terms         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("invoices")
}

enum SubscriptionType {
  FREE
  BASIC
  PREMIUM
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}
```

### 2. Authentication Middleware

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        subscription: true,
        monthlyInvoiceCount: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const checkInvoiceLimit = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user.subscription === 'FREE' && user.monthlyInvoiceCount >= 10) {
    return res.status(403).json({
      error: 'Invoice limit reached',
      message: 'Upgrade your plan to create unlimited invoices',
      currentCount: user.monthlyInvoiceCount,
      limit: 10
    });
  }

  next();
};
```

### 3. Invoice Controller

```typescript
// src/controllers/invoiceController.ts
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { generateInvoiceNumber } from '../utils/invoiceUtils';
import { sendInvoiceEmail } from '../services/emailService';
import { generateInvoicePDF } from '../services/pdfService';

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const {
      clientName,
      clientEmail,
      clientAddress,
      items,
      taxRate = 0,
      discount = 0,
      currency = 'USD',
      issueDate,
      dueDate,
      notes,
      terms
    } = req.body;

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.rate), 0
    );
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discount;

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId,
        clientName,
        clientEmail,
        clientAddress,
        items,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total,
        currency,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        notes,
        terms
      }
    });

    // Update user's monthly invoice count
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyInvoiceCount: { increment: 1 },
        invoiceCount: { increment: 1 }
      }
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

export const sendInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { user: true }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);
    
    // Send email
    await sendInvoiceEmail(invoice, pdfBuffer);

    // Update invoice status
    await prisma.invoice.update({
      where: { id },
      data: { status: 'SENT' }
    });

    res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
};
```

### 4. Stripe Integration

```typescript
// src/services/stripeService.ts
import Stripe from 'stripe';
import { prisma } from '../config/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export const createCheckoutSession = async (userId: string, priceId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) throw new Error('User not found');

    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      
      customerId = customer.id;
      
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId }
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: { userId }
    });

    return session;
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
};

export const handleWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      await updateUserSubscription(subscription);
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      await cancelUserSubscription(deletedSubscription);
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      await handleSuccessfulPayment(invoice);
      break;
  }
};

const updateUserSubscription = async (subscription: Stripe.Subscription) => {
  const customerId = subscription.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) return;

  const priceId = subscription.items.data[0].price.id;
  const subscriptionType = getSubscriptionType(priceId);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscription: subscriptionType,
      subscriptionExpiry: new Date(subscription.current_period_end * 1000)
    }
  });
};
```

## Frontend Examples

### 1. Authentication Hook

```typescript
// src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscription: 'FREE' | 'BASIC' | 'PREMIUM';
  monthlyInvoiceCount: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          if (!response.ok) throw new Error('Login failed');

          const { user, token } = await response.json();
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('auth-storage');
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });

          if (!response.ok) throw new Error('Registration failed');

          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateUser: (userData) => {
        set(state => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
);
```

### 2. Invoice Form Component

```typescript
// src/components/forms/InvoiceForm.tsx
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const invoiceSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  clientAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional()
  }),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    rate: z.number().min(0, 'Rate must be positive'),
    amount: z.number()
  })).min(1, 'At least one item is required'),
  taxRate: z.number().min(0).max(100),
  discount: z.number().min(0),
  issueDate: z.string(),
  dueDate: z.string(),
  notes: z.string().optional(),
  terms: z.string().optional()
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export const InvoiceForm = ({ onSubmit, initialData }: InvoiceFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData || {
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      taxRate: 0,
      discount: 0
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const taxRate = watch('taxRate');
  const discount = watch('discount');

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => 
    sum + (item.quantity * item.rate), 0
  );
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;

  // Update item amounts when quantity or rate changes
  React.useEffect(() => {
    watchedItems.forEach((item, index) => {
      const amount = item.quantity * item.rate;
      setValue(`items.${index}.amount`, amount);
    });
  }, [watchedItems, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Client Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Client Name *
            </label>
            <Input
              {...register('clientName')}
              className={errors.clientName ? 'border-red-500' : ''}
            />
            {errors.clientName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.clientName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Client Email *
            </label>
            <Input
              type="email"
              {...register('clientEmail')}
              className={errors.clientEmail ? 'border-red-500' : ''}
            />
            {errors.clientEmail && (
              <p className="text-red-500 text-sm mt-1">
                {errors.clientEmail.message}
              </p>
            )}
          </div>
        </div>

        {/* Address fields... */}
      </div>

      {/* Invoice Items */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Invoice Items</h3>
          <Button
            type="button"
            onClick={() => append({ description: '', quantity: 1, rate: 0, amount: 0 })}
            variant="outline"
          >
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-5">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Input
                  {...register(`items.${index}.description`)}
                  placeholder="Item description"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Quantity
                </label>
                <Input
                  type="number"
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  min="1"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Rate
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.rate`, { valueAsNumber: true })}
                  min="0"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Amount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.amount`, { valueAsNumber: true })}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div className="col-span-1">
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRate}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <Button type="submit">
          Create Invoice
        </Button>
      </div>
    </form>
  );
};
```

### 3. Usage Limit Component

```typescript
// src/components/ui/UsageLimitBanner.tsx
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown } from 'lucide-react';

export const UsageLimitBanner = () => {
  const { user } = useAuth();

  if (!user || user.subscription !== 'FREE') return null;

  const usagePercentage = (user.monthlyInvoiceCount / 10) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;

  if (usagePercentage < 50) return null;

  return (
    <div className={`p-4 rounded-lg border ${
      isAtLimit 
        ? 'bg-red-50 border-red-200' 
        : isNearLimit 
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {isAtLimit ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <Crown className="h-5 w-5 text-yellow-600" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium">
            {isAtLimit 
              ? 'Invoice limit reached' 
              : `${user.monthlyInvoiceCount} of 10 invoices used this month`
            }
          </h3>
          
          <div className="mt-2">
            <Progress 
              value={usagePercentage} 
              className="h-2"
            />
          </div>
          
          <p className="mt-2 text-sm text-gray-600">
            {isAtLimit 
              ? 'Upgrade to create unlimited invoices and unlock premium features.'
              : 'Upgrade to unlock unlimited invoices and premium features.'
            }
          </p>
        </div>
        
        <Button 
          size="sm" 
          className="flex-shrink-0"
          onClick={() => window.location.href = '/pricing'}
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};
```

These code snippets provide a solid foundation for implementing your invoice generator. Each example includes proper error handling, validation, and follows modern best practices for both backend and frontend development.