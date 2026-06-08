# Invoice Generator Database Schema

This document describes the complete PostgreSQL database schema for the Invoice Generator application using Prisma ORM.

## 📋 Schema Overview

The database consists of the following main entities:

1. **Users** - User accounts with subscription management
2. **Clients** - Customer information
3. **Invoices** - Invoice data and status
4. **InvoiceItems** - Line items for invoices
5. **Payments** - Payment records and tracking
6. **SubscriptionHistory** - User subscription history
7. **SubscriptionPlans** - Available subscription plans
8. **EmailTemplates** - Email template management
9. **AuditLogs** - System audit logging

## 🗃️ Entity Relationship Diagram

```
Users (1) -----> (N) Clients
Users (1) -----> (N) Invoices
Users (1) -----> (N) SubscriptionHistory
Users (1) -----> (N) Subscriptions (Stripe)
Invoices (1) ---> (N) Payments
SubscriptionPlans (1) ---> (N) SubscriptionHistory
```

## 📊 Detailed Schema

### Users Table

Enhanced user model with subscription management:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    company VARCHAR,
    phone VARCHAR,
    address JSONB, -- {street, city, state, zip, country}
    subscription subscription_type DEFAULT 'FREE',
    subscription_expiry TIMESTAMP,
    invoice_count INTEGER DEFAULT 0,
    monthly_invoice_count INTEGER DEFAULT 0,
    last_invoice_reset TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    email_verify_token VARCHAR,
    reset_password_token VARCHAR,
    reset_password_expires TIMESTAMP,
    last_login TIMESTAMP,
    stripe_customer_id VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features:**
- **UUID Primary Key**: Secure, non-sequential identifiers
- **JSON Address**: Flexible address storage with structured data
- **Subscription Management**: Built-in subscription tracking
- **Invoice Counting**: Track total and monthly invoice usage
- **Security Fields**: Email verification and password reset tokens
- **Stripe Integration**: Customer ID for payment processing

### Subscription System

#### SubscriptionHistory Table

```sql
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_type subscription_type NOT NULL,
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    payment_amount DECIMAL(10,2),
    currency VARCHAR DEFAULT 'USD',
    stripe_subscription_id VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### SubscriptionPlans Table

```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type subscription_type UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR DEFAULT 'USD',
    billing_period billing_period DEFAULT 'MONTHLY',
    max_invoices INTEGER NOT NULL, -- -1 for unlimited
    max_clients INTEGER NOT NULL,  -- -1 for unlimited
    features JSONB NOT NULL,       -- Array of feature strings
    is_active BOOLEAN DEFAULT true,
    stripe_price_id VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Core Business Entities

#### Clients Table

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    address JSONB, -- {street, city, state, zip, country}
    company VARCHAR,
    tax_id VARCHAR,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Invoices Table

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name VARCHAR NOT NULL,
    client_email VARCHAR,
    client_address JSONB, -- {street, city, state, zip, country}
    items JSONB NOT NULL, -- [{description, quantity, rate, amount}]
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    currency VARCHAR DEFAULT 'USD',
    status invoice_status DEFAULT 'DRAFT',
    issue_date TIMESTAMP DEFAULT NOW(),
    due_date TIMESTAMP NOT NULL,
    paid_date TIMESTAMP,
    notes TEXT,
    terms TEXT,
    stripe_payment_intent_id VARCHAR,
    stripe_invoice_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```


#### Payments Table

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR DEFAULT 'USD',
    payment_method payment_method NOT NULL,
    payment_date TIMESTAMP DEFAULT NOW(),
    reference VARCHAR,
    notes TEXT,
    stripe_payment_id VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Subscriptions Table (Stripe Integration)

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR UNIQUE NOT NULL,
    stripe_price_id VARCHAR NOT NULL,
    status subscription_status DEFAULT 'ACTIVE',
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

### System Tables

#### EmailTemplates Table

```sql
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR UNIQUE NOT NULL,
    type email_template_type NOT NULL,
    subject VARCHAR NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### AuditLogs Table

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR NOT NULL,
    resource VARCHAR NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🏷️ Enums

### SubscriptionType

```sql
CREATE TYPE subscription_type AS ENUM (
    'FREE',
    'BASIC', 
    'PREMIUM'
);
```

### BillingPeriod

```sql
CREATE TYPE billing_period AS ENUM (
    'MONTHLY',
    'YEARLY'
);
```

### SubscriptionStatus

```sql
CREATE TYPE subscription_status AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'PAST_DUE'
);
```

### InvoiceStatus

```sql
CREATE TYPE invoice_status AS ENUM (
    'DRAFT',
    'SENT',
    'VIEWED',
    'PAID',
    'OVERDUE',
    'CANCELLED'
);
```

### PaymentMethod

```sql
CREATE TYPE payment_method AS ENUM (
    'CASH',
    'CHECK',
    'BANK_TRANSFER',
    'CREDIT_CARD',
    'PAYPAL',
    'STRIPE',
    'OTHER'
);
```

### EmailTemplateType

```sql
CREATE TYPE email_template_type AS ENUM (
    'INVOICE_CREATED',
    'INVOICE_SENT',
    'PAYMENT_RECEIVED',
    'PAYMENT_REMINDER',
    'PAYMENT_OVERDUE'
);
```

## 🔍 Indexes

### Performance Indexes

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Client lookups
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_email ON clients(email);

-- Invoice lookups
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- Payment lookups
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_stripe_payment_id ON payments(stripe_payment_id);

-- Subscription lookups
CREATE INDEX idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_active ON subscription_history(is_active);

-- Audit log lookups
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## 🛡️ Security Features

### Row Level Security (RLS)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY user_isolation ON users FOR ALL TO authenticated_users USING (id = current_user_id());
CREATE POLICY client_isolation ON clients FOR ALL TO authenticated_users USING (user_id = current_user_id());
CREATE POLICY invoice_isolation ON invoices FOR ALL TO authenticated_users USING (user_id = current_user_id());
```

### Data Validation

```sql
-- Email validation
ALTER TABLE users ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Positive amounts
ALTER TABLE invoices ADD CONSTRAINT positive_amounts CHECK (
    subtotal >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND total >= 0
);

-- Valid percentages
ALTER TABLE invoices ADD CONSTRAINT valid_percentages CHECK (
    tax_rate >= 0 AND tax_rate <= 100 AND
    discount_rate >= 0 AND discount_rate <= 100
);

-- Valid subscription limits
ALTER TABLE subscription_plans ADD CONSTRAINT valid_limits CHECK (
    max_invoices >= -1 AND max_clients >= -1
);
```

## 📈 Subscription Management Logic

### Subscription Limits

| Plan | Max Invoices | Max Clients | Monthly Reset |
|------|-------------|-------------|---------------|
| FREE | 5 | 3 | Yes |
| BASIC | 50 | 25 | Yes |
| PREMIUM | Unlimited | Unlimited | No |

### Usage Tracking

- **invoice_count**: Total invoices created (lifetime)
- **monthly_invoice_count**: Invoices created this month
- **last_invoice_reset**: Last monthly reset date

### Automatic Processes

1. **Monthly Reset**: Cron job resets `monthly_invoice_count` on 1st of each month
2. **Expiry Check**: Daily cron job checks for expired subscriptions
3. **Auto-downgrade**: Expired paid subscriptions automatically downgrade to FREE

## 🔄 Migration Commands

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Create and Run Migrations

```bash
npm run prisma:migrate
```

### Seed Subscription Plans

```bash
npm run seed:subscriptions
```

### View Database

```bash
npm run prisma:studio
```

## 📊 Sample Data

### Default Subscription Plans

```json
[
  {
    "type": "FREE",
    "name": "Free Plan",
    "price": 0,
    "maxInvoices": 5,
    "maxClients": 3,
    "features": ["Basic invoice creation", "Email sending", "PDF generation"]
  },
  {
    "type": "BASIC", 
    "name": "Basic Plan",
    "price": 9.99,
    "maxInvoices": 50,
    "maxClients": 25,
    "features": ["All Free features", "Payment tracking", "Client management", "Basic reporting"]
  },
  {
    "type": "PREMIUM",
    "name": "Premium Plan", 
    "price": 29.99,
    "maxInvoices": -1,
    "maxClients": -1,
    "features": ["All Basic features", "Unlimited invoices", "Advanced reporting", "Custom branding", "API access"]
  }
]
```

This schema provides a robust foundation for a subscription-based invoice generator with comprehensive user management, flexible subscription tiers, and detailed audit logging.