# Invoice Model Implementation Guide

This document describes the enhanced Invoice model implementation with embedded client data and JSON-based line items.

## 🏗️ Model Architecture

### Key Design Decisions

1. **Embedded Client Data**: Client information is stored directly in the invoice for historical accuracy
2. **JSON Line Items**: Invoice items are stored as a JSON array for flexibility
3. **Simplified Structure**: Removed separate InvoiceItem table for better performance
4. **Flat Discount**: Changed from percentage-based to flat amount discount

## 📊 Invoice Model Structure

### Database Schema

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Embedded Client Data
    client_name VARCHAR NOT NULL,
    client_email VARCHAR,
    client_address JSONB, -- {street, city, state, zip, country}
    
    -- Line Items (JSON Array)
    items JSONB NOT NULL, -- [{description, quantity, rate, amount}]
    
    -- Financial Data
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0, -- Flat amount, not percentage
    total DECIMAL(10,2) NOT NULL,
    currency VARCHAR DEFAULT 'USD',
    
    -- Status and Dates
    status invoice_status DEFAULT 'DRAFT',
    issue_date TIMESTAMP DEFAULT NOW(),
    due_date TIMESTAMP NOT NULL,
    paid_date TIMESTAMP,
    
    -- Additional Information
    notes TEXT,
    terms TEXT,
    
    -- Stripe Integration
    stripe_payment_intent_id VARCHAR,
    stripe_invoice_id VARCHAR,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Interface

```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: ClientAddress;
  items: InvoiceItemData[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceItemData {
  description: string;
  quantity: number;
  rate: number;
  amount: number; // Calculated: quantity * rate
}

interface ClientAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}
```

## 🔧 Implementation Features

### 1. Embedded Client Data

**Benefits:**
- **Historical Accuracy**: Client data is preserved as it was when the invoice was created
- **Data Integrity**: Invoices remain valid even if client information changes
- **Performance**: No additional joins required to display invoice with client info
- **Simplicity**: Reduces complexity of queries and relationships

**Usage Example:**
```typescript
const invoiceData: CreateInvoiceData = {
  clientName: "Acme Corporation",
  clientEmail: "billing@acme.com",
  clientAddress: {
    street: "123 Business Ave",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "USA"
  },
  items: [
    {
      description: "Web Development Services",
      quantity: 40,
      rate: 75.00,
      amount: 3000.00
    }
  ],
  dueDate: new Date('2024-02-15'),
  taxRate: 8.5,
  discount: 150.00
};
```

### 2. JSON Line Items

**Structure:**
```json
[
  {
    "description": "Web Development Services",
    "quantity": 40,
    "rate": 75.00,
    "amount": 3000.00
  },
  {
    "description": "Hosting Setup",
    "quantity": 1,
    "rate": 200.00,
    "amount": 200.00
  }
]
```

**Benefits:**
- **Flexibility**: Easy to add new item properties without schema changes
- **Performance**: Fewer database tables and joins
- **Atomic Updates**: All items updated together with the invoice
- **Simplicity**: No need to manage separate item relationships

### 3. Calculation Logic

**Automatic Calculations:**
```typescript
// Item amount calculation
amount = quantity * rate

// Invoice totals calculation
subtotal = sum(items.amount)
taxableAmount = subtotal - discount
taxAmount = (taxableAmount * taxRate) / 100
total = taxableAmount + taxAmount
```

**Example:**
```
Items:
- Item 1: 10 × $50.00 = $500.00
- Item 2: 5 × $30.00 = $150.00

Subtotal: $650.00
Discount: -$50.00
Taxable Amount: $600.00
Tax (8.5%): $51.00
Total: $651.00
```

## 🚀 Service Layer Implementation

### InvoiceService Methods

```typescript
class InvoiceService {
  // Create new invoice with automatic calculations
  static async createInvoice(userId: string, data: CreateInvoiceData): Promise<Invoice>
  
  // Get invoice by ID with user ownership check
  static async getInvoiceById(invoiceId: string, userId: string): Promise<Invoice>
  
  // Get paginated list of user's invoices with filtering
  static async getUserInvoices(userId: string, query: InvoiceQuery): Promise<PaginatedResponse<Invoice>>
  
  // Update invoice with recalculation of totals
  static async updateInvoice(invoiceId: string, userId: string, data: UpdateInvoiceData): Promise<Invoice>
  
  // Delete invoice (with restrictions for paid invoices)
  static async deleteInvoice(invoiceId: string, userId: string): Promise<void>
  
  // Status management
  static async markAsSent(invoiceId: string, userId: string): Promise<Invoice>
  static async markAsPaid(invoiceId: string, userId: string): Promise<Invoice>
  
  // Analytics and reporting
  static async getInvoiceStats(userId: string): Promise<InvoiceStats>
  static async getRecentInvoices(userId: string, limit?: number): Promise<Invoice[]>
  
  // Utility functions
  static async duplicateInvoice(invoiceId: string, userId: string): Promise<Invoice>
  static async updateOverdueInvoices(): Promise<number>
}
```

### Key Features

1. **Subscription Limits**: Automatic checking before invoice creation
2. **Auto-calculations**: Totals recalculated when items or rates change
3. **Status Management**: Proper handling of status transitions
4. **Overdue Detection**: Automatic detection and updating of overdue invoices
5. **Data Validation**: Comprehensive validation of all input data

## 📋 API Usage Examples

### Create Invoice

```typescript
POST /api/v1/invoices
{
  "clientName": "Acme Corporation",
  "clientEmail": "billing@acme.com",
  "clientAddress": {
    "street": "123 Business Ave",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "items": [
    {
      "description": "Web Development",
      "quantity": 40,
      "rate": 75.00,
      "amount": 3000.00
    },
    {
      "description": "Hosting Setup",
      "quantity": 1,
      "rate": 200.00,
      "amount": 200.00
    }
  ],
  "dueDate": "2024-02-15",
  "taxRate": 8.5,
  "discount": 150.00,
  "notes": "Payment due within 30 days",
  "terms": "Net 30"
}
```

### Update Invoice

```typescript
PUT /api/v1/invoices/:id
{
  "status": "SENT",
  "items": [
    {
      "description": "Updated Web Development",
      "quantity": 45,
      "rate": 75.00,
      "amount": 3375.00
    }
  ],
  "discount": 200.00
}
```

### Query Invoices

```typescript
GET /api/v1/invoices?page=1&limit=10&status=SENT&search=Acme&dateFrom=2024-01-01&dateTo=2024-12-31
```

## 🔍 Advanced Features

### 1. Automatic Overdue Detection

```typescript
// Cron job runs daily to update overdue invoices
cron.schedule('0 1 * * *', async () => {
  await InvoiceService.updateOverdueInvoices();
});
```

### 2. Invoice Duplication

```typescript
// Duplicate existing invoice with new due date
const duplicatedInvoice = await InvoiceService.duplicateInvoice(originalId, userId);
```

### 3. Comprehensive Search

```typescript
// Search across invoice number, client name, and client email
const invoices = await InvoiceService.getUserInvoices(userId, {
  search: "Acme",
  status: "SENT",
  dateFrom: "2024-01-01"
});
```

### 4. Analytics and Reporting

```typescript
const stats = await InvoiceService.getInvoiceStats(userId);
// Returns:
// {
//   totalInvoices: 150,
//   paidInvoices: 120,
//   pendingInvoices: 25,
//   overdueInvoices: 5,
//   totalRevenue: 125000.00,
//   pendingRevenue: 15000.00
// }
```

## 🛡️ Security and Validation

### 1. Input Validation

```typescript
// Comprehensive validation for all fields
export const validateCreateInvoice: ValidationChain[] = [
  body('clientName').trim().isLength({ min: 1, max: 100 }),
  body('clientEmail').optional().isEmail(),
  body('items').isArray({ min: 1 }),
  body('items.*.description').trim().isLength({ min: 1, max: 200 }),
  body('items.*.quantity').isFloat({ min: 0.01 }),
  body('items.*.rate').isFloat({ min: 0 }),
  body('items.*.amount').isFloat({ min: 0 }),
  // ... more validations
];
```

### 2. User Ownership Checks

```typescript
// All operations verify user ownership
const invoice = await prisma.invoice.findFirst({
  where: {
    id: invoiceId,
    userId // Ensures user can only access their own invoices
  }
});
```

### 3. Business Rules

```typescript
// Prevent modification of paid invoices
if (existingInvoice.status === 'PAID' && data.status !== 'PAID') {
  throw new AuthorizationError('Cannot modify a paid invoice');
}

// Prevent deletion of paid invoices
if (invoice.status === 'PAID') {
  throw new AuthorizationError('Cannot delete a paid invoice');
}
```

## 📈 Performance Considerations

### 1. Indexing Strategy

```sql
-- Essential indexes for performance
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_client_name ON invoices(client_name);
```

### 2. JSON Querying

```sql
-- Query items within invoices (PostgreSQL)
SELECT * FROM invoices 
WHERE items @> '[{"description": "Web Development"}]';

-- Search within JSON items
SELECT * FROM invoices 
WHERE items::text ILIKE '%Web Development%';
```

### 3. Pagination

```typescript
// Efficient pagination with offset/limit
const { page, limit, skip } = parsePaginationQuery(query);
const invoices = await prisma.invoice.findMany({
  where,
  skip,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

## 🔄 Migration from Previous Model

If migrating from a separate InvoiceItems table:

```sql
-- Migration script to convert separate items to JSON
UPDATE invoices SET items = (
  SELECT json_agg(
    json_build_object(
      'description', ii.description,
      'quantity', ii.quantity,
      'rate', ii.rate,
      'amount', ii.amount
    )
  )
  FROM invoice_items ii 
  WHERE ii.invoice_id = invoices.id
);

-- Drop old table after verification
DROP TABLE invoice_items;
```

This enhanced Invoice model provides a robust, flexible, and performant foundation for invoice management with embedded client data and JSON-based line items.