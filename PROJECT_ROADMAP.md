# Invoice Generator Web App - Complete Development Roadmap

## Project Overview
A modern, responsive invoice generator with freemium pricing model:
- **Free Tier**: Up to 10 invoices per month
- **Paid Tiers**: Unlimited invoices, advanced features, integrations
- **Tech Stack**: React/Next.js frontend, Node.js/Express backend, PostgreSQL database

## Architecture Overview

```
Frontend (React/Next.js) ↔ Backend API (Node.js/Express) ↔ Database (PostgreSQL)
                                    ↕
                            Payment Gateway (Stripe)
                                    ↕
                            Email Service (SendGrid/Nodemailer)
```

---

## BACKEND DEVELOPMENT PROMPTS

### 1. Project Setup & Environment Configuration

**Prompt:**
```
Create a Node.js backend for an invoice generator with the following requirements:

SETUP:
- Initialize a new Node.js project with Express.js framework
- Set up TypeScript for type safety
- Configure environment variables for:
  - Database connection (PostgreSQL)
  - JWT secret for authentication
  - Stripe API keys (test and live)
  - Email service credentials
  - CORS origins for frontend
- Install and configure essential middleware:
  - express-rate-limit for API rate limiting
  - helmet for security headers
  - morgan for logging
  - cors for cross-origin requests
  - express-validator for input validation

PROJECT STRUCTURE:
```
src/
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Helper functions
├── types/          # TypeScript types
└── config/         # Configuration files
```

DEPENDENCIES TO INCLUDE:
- express, typescript, ts-node
- pg (PostgreSQL client), prisma (ORM)
- jsonwebtoken, bcryptjs (authentication)
- stripe (payments)
- nodemailer or @sendgrid/mail (emails)
- joi or express-validator (validation)
- dotenv (environment variables)
```

### 2. Database Schema & Models

**Prompt:**
```
Design and implement a PostgreSQL database schema using Prisma ORM with the following entities:

USER MODEL:
- id (UUID, primary key)
- email (unique, required)
- password (hashed, required)
- firstName, lastName
- company (optional)
- phone (optional)
- address (JSON object with street, city, state, zip, country)
- subscription (enum: FREE, BASIC, PREMIUM)
- subscriptionExpiry (date)
- invoiceCount (integer, default 0)
- monthlyInvoiceCount (integer, default 0)
- lastInvoiceReset (date)
- createdAt, updatedAt
- isActive (boolean, default true)

INVOICE MODEL:
- id (UUID, primary key)
- invoiceNumber (string, unique)
- userId (foreign key to User)
- clientName (required)
- clientEmail
- clientAddress (JSON object)
- items (JSON array of {description, quantity, rate, amount})
- subtotal (decimal)
- taxRate (decimal, default 0)
- taxAmount (decimal)
- discount (decimal, default 0)
- total (decimal)
- currency (string, default 'USD')
- status (enum: DRAFT, SENT, PAID, OVERDUE, CANCELLED)
- issueDate (date)
- dueDate (date)
- paidDate (date, optional)
- notes (text, optional)
- terms (text, optional)
- createdAt, updatedAt

SUBSCRIPTION MODEL:
- id (UUID, primary key)
- userId (foreign key to User)
- stripeSubscriptionId (string)
- stripePriceId (string)
- status (enum: ACTIVE, CANCELLED, PAST_DUE)
- currentPeriodStart (date)
- currentPeriodEnd (date)
- createdAt, updatedAt

Include proper indexes, constraints, and relationships between models.
```

### 3. Authentication & Authorization System

**Prompt:**
```
Implement a complete authentication and authorization system with:

AUTHENTICATION ROUTES:
- POST /auth/register - User registration with email verification
- POST /auth/login - User login with JWT token generation
- POST /auth/logout - Token invalidation
- POST /auth/forgot-password - Password reset email
- POST /auth/reset-password - Password reset with token
- GET /auth/verify-email - Email verification
- POST /auth/refresh-token - JWT token refresh

MIDDLEWARE:
- authenticateToken: Verify JWT and attach user to request
- requireAuth: Ensure user is authenticated
- checkSubscription: Verify user's subscription status and limits

FEATURES:
- Password hashing with bcrypt (minimum 12 rounds)
- JWT tokens with 15-minute access tokens and 7-day refresh tokens
- Rate limiting on auth endpoints (5 attempts per 15 minutes)
- Email verification required for account activation
- Secure password reset with time-limited tokens
- Account lockout after 5 failed login attempts

VALIDATION:
- Email format validation
- Password strength requirements (min 8 chars, uppercase, lowercase, number, special char)
- Input sanitization to prevent injection attacks

SECURITY HEADERS:
- Implement helmet.js for security headers
- CORS configuration for frontend domain only
- Secure cookie settings for refresh tokens
```

### 4. Invoice Management API

**Prompt:**
```
Create comprehensive invoice management endpoints with subscription-based limits:

INVOICE ROUTES:
- GET /invoices - List user's invoices with pagination, filtering, sorting
- GET /invoices/:id - Get single invoice details
- POST /invoices - Create new invoice (check monthly limits)
- PUT /invoices/:id - Update invoice (only if status is DRAFT)
- DELETE /invoices/:id - Soft delete invoice
- POST /invoices/:id/send - Send invoice via email
- POST /invoices/:id/mark-paid - Mark invoice as paid
- GET /invoices/:id/pdf - Generate and download PDF

BUSINESS LOGIC:
- Free users: Maximum 10 invoices per month
- Automatic invoice numbering (INV-YYYY-MM-NNNN format)
- Invoice status workflow: DRAFT → SENT → PAID/OVERDUE
- Automatic overdue detection (daily cron job)
- Monthly invoice count reset on subscription anniversary

VALIDATION:
- Validate all invoice fields (client info, items, amounts)
- Ensure calculated totals match (subtotal + tax - discount = total)
- Prevent negative quantities or rates
- Validate currency codes (ISO 4217)
- Date validation (due date after issue date)

PDF GENERATION:
- Use puppeteer or jsPDF to generate professional PDF invoices
- Include company branding, invoice details, itemized list
- Responsive design that works on all devices
- Option to customize invoice template

EMAIL INTEGRATION:
- Send invoice PDFs as email attachments
- Professional email templates
- Track email delivery status
- Include payment instructions and due dates
```

### 5. Subscription & Payment Integration

**Prompt:**
```
Implement Stripe integration for subscription management:

SUBSCRIPTION TIERS:
- FREE: $0/month, 10 invoices, basic templates
- BASIC: $9.99/month, unlimited invoices, custom branding
- PREMIUM: $19.99/month, unlimited invoices, advanced features, integrations

STRIPE INTEGRATION:
- POST /subscriptions/create-checkout - Create Stripe checkout session
- POST /subscriptions/cancel - Cancel subscription
- POST /subscriptions/update - Update subscription plan
- GET /subscriptions/current - Get current subscription details
- POST /webhooks/stripe - Handle Stripe webhooks

WEBHOOK HANDLING:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

SUBSCRIPTION LOGIC:
- Automatic plan upgrades/downgrades
- Prorated billing for plan changes
- Grace period for failed payments (3 days)
- Automatic downgrade to free plan after cancellation
- Usage tracking and limit enforcement

PAYMENT SECURITY:
- Never store credit card information
- Use Stripe's secure payment processing
- Implement webhook signature verification
- Handle payment failures gracefully
- PCI compliance through Stripe
```

### 6. API Documentation & Testing

**Prompt:**
```
Create comprehensive API documentation and testing suite:

API DOCUMENTATION (using Swagger/OpenAPI):
- Document all endpoints with request/response schemas
- Include authentication requirements
- Provide example requests and responses
- Document error codes and messages
- Interactive API explorer for testing

TESTING SUITE:
- Unit tests for all services and utilities
- Integration tests for API endpoints
- Authentication flow testing
- Subscription limit testing
- Payment webhook testing
- Database transaction testing

TEST COVERAGE:
- Aim for 80%+ code coverage
- Test happy paths and error scenarios
- Mock external services (Stripe, email)
- Test rate limiting and security measures
- Performance testing for high load scenarios

MONITORING & LOGGING:
- Structured logging with Winston
- Error tracking with Sentry or similar
- API performance monitoring
- Database query optimization
- Health check endpoints for uptime monitoring
```

---

## FRONTEND DEVELOPMENT PROMPTS

### 1. Project Setup & Architecture

**Prompt:**
```
Create a modern React/Next.js frontend for the invoice generator with:

SETUP:
- Initialize Next.js 14+ with TypeScript and App Router
- Configure Tailwind CSS for styling
- Set up ESLint and Prettier for code quality
- Configure environment variables for API endpoints

PROJECT STRUCTURE:
```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (buttons, inputs)
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   └── invoice/        # Invoice-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── services/           # API service functions
├── store/              # State management (Zustand)
├── types/              # TypeScript type definitions
└── styles/             # Global styles and Tailwind config
```

DEPENDENCIES:
- next, react, typescript
- tailwindcss, @headlessui/react (UI components)
- react-hook-form, zod (form handling and validation)
- zustand (state management)
- axios or fetch (API calls)
- react-pdf or jspdf (PDF generation)
- lucide-react (icons)
- date-fns (date utilities)
```

### 2. Authentication & User Interface

**Prompt:**
```
Build a complete authentication system with modern UX:

AUTHENTICATION PAGES:
- /login - Clean login form with email/password
- /register - Registration form with email verification notice
- /forgot-password - Password reset request form
- /reset-password - New password form with token validation
- /verify-email - Email verification confirmation page

UI COMPONENTS:
- Responsive design that works on mobile, tablet, desktop
- Loading states for all async operations
- Form validation with real-time feedback
- Error handling with user-friendly messages
- Success notifications for completed actions

FEATURES:
- Remember me functionality with secure token storage
- Social login options (Google, GitHub) - optional
- Protected routes that redirect to login
- Automatic token refresh handling
- Logout functionality that clears all stored data

SECURITY:
- Store JWT tokens securely (httpOnly cookies preferred)
- Implement CSRF protection
- Input sanitization on all forms
- Rate limiting feedback to users
- Secure password visibility toggle

ACCESSIBILITY:
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management for modals and forms
```

### 3. Dashboard & Invoice Management

**Prompt:**
```
Create an intuitive dashboard and invoice management interface:

DASHBOARD LAYOUT:
- Sidebar navigation with collapsible mobile menu
- Header with user profile, notifications, search
- Main content area with responsive grid layout
- Quick stats cards (total invoices, pending payments, monthly revenue)
- Recent invoices table with status indicators

INVOICE LIST VIEW:
- Searchable and filterable invoice table
- Sortable columns (date, amount, status, client)
- Pagination with configurable page sizes
- Bulk actions (delete, send, mark as paid)
- Status badges with color coding
- Export functionality (CSV, PDF)

INVOICE FORM:
- Multi-step form for creating/editing invoices
- Auto-save draft functionality
- Dynamic item addition/removal
- Real-time calculation of totals
- Client information auto-complete
- Date pickers for issue/due dates
- Rich text editor for notes and terms

RESPONSIVE DESIGN:
- Mobile-first approach
- Touch-friendly interface for tablets
- Collapsible sections on small screens
- Swipe gestures for mobile actions
- Optimized performance for slow connections

STATE MANAGEMENT:
- Global state for user authentication
- Local state for form data
- Optimistic updates for better UX
- Error boundary components
- Loading skeletons for better perceived performance
```

### 4. Invoice Creation & PDF Generation

**Prompt:**
```
Build a sophisticated invoice creation system with live preview:

INVOICE BUILDER:
- Split-screen layout: form on left, live preview on right
- Drag-and-drop item reordering
- Inline editing in preview mode
- Multiple currency support with conversion
- Tax calculation with multiple tax rates
- Discount options (percentage or fixed amount)
- Custom fields for industry-specific needs

PDF GENERATION:
- Professional invoice templates (3-4 different designs)
- Company logo upload and positioning
- Custom color schemes and branding
- Print-optimized layouts
- Watermarks for draft invoices
- QR codes for payment links
- Multi-language support

TEMPLATE SYSTEM:
- Pre-built professional templates
- Template customization options
- Save custom templates for reuse
- Template preview gallery
- Industry-specific templates (freelance, retail, service)

ADVANCED FEATURES:
- Recurring invoice setup
- Payment terms templates
- Late fee calculation
- Multi-currency invoicing
- Tax-inclusive/exclusive pricing
- Project-based invoicing with time tracking
```

### 5. Subscription & Payment Interface

**Prompt:**
```
Create a seamless subscription and payment experience:

PRICING PAGE:
- Clear pricing tiers with feature comparison
- Annual/monthly toggle with savings highlight
- Feature tooltips and explanations
- Customer testimonials and social proof
- FAQ section addressing common concerns
- Money-back guarantee information

SUBSCRIPTION MANAGEMENT:
- Current plan display with usage statistics
- Upgrade/downgrade options with immediate effect
- Billing history with downloadable invoices
- Payment method management
- Cancellation flow with retention offers
- Reactivation options for cancelled accounts

STRIPE INTEGRATION:
- Secure checkout flow with Stripe Elements
- Payment method validation and error handling
- 3D Secure authentication support
- Subscription change confirmations
- Failed payment recovery flows
- Dunning management for failed payments

USAGE TRACKING:
- Visual progress bars for invoice limits
- Usage notifications (80%, 90%, 100% of limit)
- Upgrade prompts when approaching limits
- Historical usage charts
- Export usage data functionality

BILLING INTERFACE:
- Clean invoice display with payment status
- Download receipts and tax documents
- Proration explanations for plan changes
- Refund request interface
- Tax information collection (for EU VAT, etc.)
```

### 6. Advanced Features & Integrations

**Prompt:**
```
Implement advanced features for premium users:

CLIENT MANAGEMENT:
- Client database with contact information
- Client portal for invoice viewing and payment
- Client communication history
- Automated follow-up sequences
- Client categorization and tagging

REPORTING & ANALYTICS:
- Revenue dashboard with charts and graphs
- Payment trends and forecasting
- Client analysis and segmentation
- Export reports in multiple formats
- Custom date range filtering
- Comparative period analysis

INTEGRATIONS:
- Accounting software sync (QuickBooks, Xero)
- CRM integration (Salesforce, HubSpot)
- Time tracking integration (Toggl, Harvest)
- Bank account connection for payment tracking
- Email marketing integration (Mailchimp)
- Calendar integration for payment reminders

AUTOMATION FEATURES:
- Automated invoice sending schedules
- Payment reminder sequences
- Late fee application
- Recurring invoice generation
- Client onboarding workflows
- Tax calculation automation

MOBILE OPTIMIZATION:
- Progressive Web App (PWA) capabilities
- Offline functionality for viewing invoices
- Mobile-specific UI optimizations
- Touch gestures and interactions
- Camera integration for receipt scanning
- Push notifications for important events
```

---

## DEPLOYMENT & HOSTING GUIDE

### Production Deployment Checklist

**Infrastructure:**
- Frontend: Vercel, Netlify, or AWS Amplify
- Backend: Railway, Render, or AWS ECS
- Database: PostgreSQL on AWS RDS or Supabase
- File Storage: AWS S3 or Cloudinary for logos/attachments
- CDN: CloudFlare for global performance

**Security Configuration:**
- HTTPS enforcement with SSL certificates
- Environment variable security
- Database connection encryption
- API rate limiting in production
- CORS configuration for production domains
- Security headers and CSP policies

**Monitoring & Maintenance:**
- Error tracking (Sentry, LogRocket)
- Performance monitoring (New Relic, DataDog)
- Uptime monitoring (Pingdom, UptimeRobot)
- Database backups and disaster recovery
- Automated testing in CI/CD pipeline

---

## MONETIZATION STRATEGY

### Pricing Tiers
1. **FREE**: 10 invoices/month, basic templates, email support
2. **BASIC ($9.99/month)**: Unlimited invoices, custom branding, priority support
3. **PREMIUM ($19.99/month)**: All features, integrations, advanced reporting, API access

### Revenue Optimization
- 14-day free trial for paid plans
- Annual billing discount (20% off)
- Usage-based upgrade prompts
- Referral program with credits
- Enterprise plans for large businesses

This roadmap provides comprehensive prompts for building a professional invoice generator with a sustainable freemium business model. Each section can be implemented incrementally, allowing you to launch with core features and expand over time.