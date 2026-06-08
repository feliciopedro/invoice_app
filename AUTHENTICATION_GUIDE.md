# Authentication & Authorization System

This document provides a comprehensive guide to the authentication and authorization system implemented in the Invoice Generator API.

## Overview

The authentication system provides secure user registration, login, email verification, password reset, and subscription-based authorization. It uses JWT tokens for stateless authentication and includes comprehensive security measures.

## Features

### ✅ Authentication Features
- **User Registration** with email verification
- **Secure Login** with JWT tokens
- **Password Reset** via email
- **Email Verification** required for full account access
- **Token Refresh** for seamless user experience
- **Account Lockout** after failed login attempts
- **Rate Limiting** on authentication endpoints
- **Secure Password Requirements** (8+ chars, uppercase, lowercase, number, special char)

### ✅ Authorization Features
- **Subscription-based Access Control** (FREE, BASIC, PREMIUM)
- **Feature-based Permissions** 
- **Resource Ownership Validation**
- **Automatic Subscription Expiry Handling**
- **Usage Limits Enforcement** (invoices, clients)

### ✅ Security Features
- **Password Hashing** with bcrypt (12 rounds)
- **JWT Token Blacklisting** for logout
- **Rate Limiting** (5 attempts per 15 minutes)
- **Account Lockout** (15 minutes after 5 failed attempts)
- **Secure Cookie Storage** for refresh tokens
- **CORS Protection**
- **Input Validation & Sanitization**

## API Endpoints

### Authentication Routes

All authentication routes are prefixed with `/api/v1/auth`

#### POST `/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp", // optional
  "phone": "+1234567890", // optional
  "address": { // optional
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "company": "Acme Corp",
      "subscription": "FREE",
      "isEmailVerified": false,
      "createdAt": "2026-03-31T10:00:00Z"
    },
    "accessToken": "jwt_token_here"
  }
}
```

#### POST `/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "subscription": "FREE",
      "isEmailVerified": true,
      "lastLoginAt": "2026-03-31T10:00:00Z"
    },
    "accessToken": "jwt_token_here"
  }
}
```

#### POST `/logout`
Logout and invalidate tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST `/refresh-token`
Refresh access token using refresh token.

**Request:** Refresh token can be sent via:
- HTTP-only cookie (recommended)
- Request body: `{ "refreshToken": "token_here" }`

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_token_here"
  }
}
```

#### GET `/verify-email?token=<verification_token>`
Verify email address using verification token.

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "isEmailVerified": true
    }
  }
}
```

#### POST `/forgot-password`
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### POST `/reset-password`
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

#### POST `/resend-verification`
Resend email verification.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

### Protected Routes

#### GET `/me`
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "company": "Acme Corp",
      "phone": "+1234567890",
      "address": {...},
      "subscription": "FREE",
      "subscriptionExpiry": null,
      "invoiceCount": 5,
      "monthlyInvoiceCount": 5,
      "isEmailVerified": true,
      "createdAt": "2026-03-31T10:00:00Z",
      "lastLoginAt": "2026-03-31T11:00:00Z"
    }
  }
}
```

#### PUT `/profile`
Update user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "company": "New Company",
  "phone": "+1987654321",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90210",
    "country": "USA"
  }
}
```

#### POST `/change-password`
Change user password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

## Middleware

### Authentication Middleware

#### `authenticateToken`
Verifies JWT token and attaches user to request.

```typescript
import { authenticateToken } from '@/middleware/auth';

router.get('/protected', authenticateToken, (req, res) => {
  // req.user is available here
});
```

#### `requireAuth` (alias for `authenticateToken`)
Same as `authenticateToken` but with a more descriptive name.

```typescript
import { requireAuth } from '@/middleware/auth';

router.get('/protected', requireAuth, (req, res) => {
  // req.user is available here
});
```

#### `requireEmailVerification`
Ensures user's email is verified.

```typescript
import { requireAuth, requireEmailVerification } from '@/middleware/auth';

router.post('/create-invoice', 
  requireAuth, 
  requireEmailVerification, 
  (req, res) => {
    // User is authenticated and email verified
  }
);
```

#### `optionalAuth`
Attaches user to request if token is provided, but doesn't fail if no token.

```typescript
import { optionalAuth } from '@/middleware/auth';

router.get('/public-with-optional-auth', optionalAuth, (req, res) => {
  // req.user might be available
  if (req.user) {
    // User is logged in
  } else {
    // Anonymous user
  }
});
```

### Authorization Middleware

#### `checkSubscription`
Checks subscription status and handles expired subscriptions.

```typescript
import { requireAuth, checkSubscription } from '@/middleware';

router.use('/invoices', requireAuth, checkSubscription);
```

#### `checkInvoiceLimit`
Ensures user can create invoices within their subscription limits.

```typescript
import { checkInvoiceLimit } from '@/middleware/subscription';

router.post('/invoices', 
  requireAuth, 
  checkInvoiceLimit, 
  createInvoice
);
```

#### `checkClientLimit`
Ensures user can create clients within their subscription limits.

```typescript
import { checkClientLimit } from '@/middleware/subscription';

router.post('/clients', 
  requireAuth, 
  checkClientLimit, 
  createClient
);
```

#### `checkFeatureAccess`
Checks if user has access to specific features.

```typescript
import { checkFeatureAccess } from '@/middleware/subscription';

router.get('/advanced-reports', 
  requireAuth, 
  checkFeatureAccess('advanced_reports'), 
  getAdvancedReports
);
```

## Email Templates

The system includes professional email templates for:

- **Email Verification** - Welcome email with verification link
- **Password Reset** - Secure password reset instructions
- **Welcome Email** - Sent after email verification
- **Invoice Emails** - Professional invoice delivery to clients

### Email Configuration

Configure email service in `.env`:

```env
# SendGrid (recommended for production)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMTP (alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Security Configuration

### JWT Configuration

```env
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRES_IN=30d
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character (@$!%*?&)

### Rate Limiting

- **Authentication endpoints**: 5 attempts per 15 minutes
- **Password reset**: 3 attempts per hour
- **Email verification**: 3 attempts per 10 minutes

### Account Security

- **Account lockout**: 15 minutes after 5 failed login attempts
- **Token expiry**: Access tokens expire in 7 days, refresh tokens in 30 days
- **Secure cookies**: Refresh tokens stored in httpOnly cookies

## Subscription System Integration

The authentication system is tightly integrated with the subscription system:

### Subscription Types

- **FREE**: 10 invoices/month, basic features
- **BASIC**: Unlimited invoices, custom branding
- **PREMIUM**: All features, advanced reporting, API access

### Usage Tracking

- Monthly invoice count resets automatically
- Real-time limit checking before resource creation
- Automatic downgrade when subscription expires

## Error Handling

### Common Error Responses

#### Authentication Errors (401)
```json
{
  "success": false,
  "message": "Invalid token",
  "error": "AuthenticationError"
}
```

#### Authorization Errors (403)
```json
{
  "success": false,
  "message": "Access denied",
  "error": "AuthorizationError"
}
```

#### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

#### Rate Limit Errors (429)
```json
{
  "success": false,
  "message": "Too many authentication attempts. Please try again later."
}
```

## Testing

### Manual Testing

Run the authentication test script:

```bash
npx ts-node src/scripts/testAuth.ts
```

### API Testing with curl

#### Register a user:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

#### Access protected route:
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

The authentication system uses the following database fields:

```sql
-- Users table authentication fields
id                      UUID PRIMARY KEY
email                   VARCHAR UNIQUE NOT NULL
password                VARCHAR NOT NULL
firstName               VARCHAR NOT NULL
lastName                VARCHAR NOT NULL
company                 VARCHAR
phone                   VARCHAR
address                 JSON
subscription            ENUM('FREE', 'BASIC', 'PREMIUM') DEFAULT 'FREE'
subscriptionExpiry      TIMESTAMP
invoiceCount            INTEGER DEFAULT 0
monthlyInvoiceCount     INTEGER DEFAULT 0
lastInvoiceReset        TIMESTAMP
isActive                BOOLEAN DEFAULT true
isEmailVerified         BOOLEAN DEFAULT false
emailVerificationToken  VARCHAR
emailVerificationExpiry TIMESTAMP
passwordResetToken      VARCHAR
passwordResetExpiry     TIMESTAMP
loginAttempts           INTEGER DEFAULT 0
lockoutUntil            TIMESTAMP
lastLoginAt             TIMESTAMP
createdAt               TIMESTAMP DEFAULT NOW()
updatedAt               TIMESTAMP DEFAULT NOW()
```

## Deployment Considerations

### Environment Variables

Ensure these environment variables are set in production:

```env
NODE_ENV=production
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
SENDGRID_API_KEY=your_sendgrid_key
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure JWT secrets (32+ characters)
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure email service
- [ ] Set up database backups
- [ ] Enable security headers (helmet.js)

## Support

For issues or questions about the authentication system:

1. Check the error logs for detailed error messages
2. Verify environment variables are set correctly
3. Test with the provided test script
4. Check rate limiting if requests are failing
5. Verify email service configuration for email-related features

The authentication system is designed to be secure, scalable, and user-friendly while providing comprehensive access control for the invoice generator application.