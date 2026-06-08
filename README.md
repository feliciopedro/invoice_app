# Invoice Generator Backend

A robust Node.js backend API for an invoice generator application built with TypeScript, Express.js, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Invoice Management**: Create, update, and manage invoices
- **Client Management**: Manage client information and relationships
- **Payment Processing**: Stripe integration for payments
- **Email Notifications**: Automated email sending with templates
- **File Uploads**: Secure file upload handling
- **Rate Limiting**: API rate limiting for security
- **Comprehensive Logging**: Structured logging with multiple levels
- **Input Validation**: Robust request validation
- **Error Handling**: Centralized error handling
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Helmet, CORS, and other security middleware

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Payments**: Stripe
- **Email**: SendGrid / Nodemailer
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Custom logger with file output
- **Testing**: Jest

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoice-generator-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/invoice_generator_db"
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   # ... other variables
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   ```

5. **Build the project**
   ```bash
   npm run build
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### User Endpoints
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `DELETE /users/account` - Delete user account

### Client Endpoints
- `GET /clients` - Get all clients (paginated)
- `POST /clients` - Create new client
- `GET /clients/:id` - Get client by ID
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

### Invoice Endpoints
- `GET /invoices` - Get all invoices (paginated)
- `POST /invoices` - Create new invoice
- `GET /invoices/:id` - Get invoice by ID
- `PUT /invoices/:id` - Update invoice
- `DELETE /invoices/:id` - Delete invoice
- `POST /invoices/:id/send` - Send invoice via email
- `GET /invoices/:id/pdf` - Generate invoice PDF

### Payment Endpoints
- `GET /payments` - Get all payments
- `POST /payments` - Record new payment
- `GET /payments/:id` - Get payment by ID
- `POST /payments/stripe/create-intent` - Create Stripe payment intent
- `POST /payments/stripe/webhook` - Stripe webhook handler

### Health Check
- `GET /health` - Server health check

## 🗂️ Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # Database configuration
│   └── index.ts     # Main configuration
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
│   ├── auth.ts      # Authentication middleware
│   ├── validation.ts # Request validation
│   ├── errorHandler.ts # Error handling
│   └── security.ts  # Security middleware
├── models/          # Database models (Prisma)
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helper functions
│   ├── auth.ts      # Auth utilities
│   ├── helpers.ts   # General helpers
│   └── logger.ts    # Logging utility
├── types/           # TypeScript type definitions
└── index.ts         # Application entry point
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Rate Limiting**: Configurable rate limiting per IP
- **CORS Protection**: Configurable CORS origins
- **Security Headers**: Helmet.js security headers
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: Input sanitization and validation

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts and authentication
- **Clients**: Customer information
- **Invoices**: Invoice data and status
- **InvoiceItems**: Line items for invoices
- **Payments**: Payment records and tracking
- **EmailTemplates**: Email template management
- **AuditLogs**: System audit logging

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📝 Logging

The application includes comprehensive logging:

- **Request/Response logging**: HTTP request and response details
- **Database operations**: Database query logging
- **Authentication events**: Login, logout, token refresh
- **Payment transactions**: Payment processing events
- **Error tracking**: Detailed error information
- **Security events**: Security-related activities

Logs are output to both console and file (configurable).

## 🔧 Configuration

Key configuration options in `.env`:

### Server
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)
- `API_VERSION`: API version (default: v1)

### Database
- `DATABASE_URL`: PostgreSQL connection string

### Authentication
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Access token expiration
- `JWT_REFRESH_SECRET`: Refresh token secret
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration

### Stripe
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

### Email
- `SENDGRID_API_KEY`: SendGrid API key
- `SENDGRID_FROM_EMAIL`: Default sender email

### Security
- `CORS_ORIGIN`: Allowed CORS origins
- `RATE_LIMIT_WINDOW_MS`: Rate limit window
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t invoice-generator-backend .

# Run container
docker run -p 3000:3000 --env-file .env invoice-generator-backend
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Start the application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
  - User authentication and management
  - Client management
  - Invoice creation and management
  - Payment processing with Stripe
  - Email notifications
  - Comprehensive API documentation