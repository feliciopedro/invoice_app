# Invoicing & Ledger Management Web Application

A premium, high-contrast monochrome, translation-ready, and timezone-aware invoice generation and management application. Built using a Node.js & Express.js backend (with Prisma ORM and PostgreSQL) and a modern React (Vite & Tailwind CSS v4) frontend.

---

## 🚀 Key Features

### Frontend (Single Page Application)
- **Monochrome Editorial Theme**: High-contrast, sleek off-white and dark charcoal design optimized for professional invoicing.
- **Dynamic Localization & Currency Formatting**: Complete internationalization (i18n) wrapping supporting **41 global currencies** (including USD, EUR, and a comprehensive set of African currencies like NGN, ZAR, EGP, KES, GHS, MAD, and more) formatted with their native symbols and layout.
- **Timezone-Aware Dates**: Date handling mapped dynamically to the user's selected timezone (using `date-fns-tz` and a dedicated setting dropdown).
- **Responsive Layout**: Designed with tailwind layouts, collapsing sidebars, modals, and tables.
- **Live Form Summaries**: Real-time invoice line items calculations (subtotal, tax rates, flat discount subtractions, and totals) using React Hook Form's field arrays.
- **PDF Generation & Downloads**: Binary downloads generated directly on the server and downloaded locally as a PDF sheet.

### Backend (REST API)
- **JWT-Based Authentication**: Secure registration, login, and profile tracking using token cookies or authorization headers.
- **Prisma & PostgreSQL ORM**: Structured database migrations, relational schema validations, and query execution.
- **Secure Password Upgrades**: Dedicated route to safely change passwords after verifying current credentials.
- **Structured Validation**: High-performance request validations utilizing Zod schema structures.
- **File Upload Handler**: Custom logo uploading for user business profiles.

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Security**: CORS, Helmet, rate-limiting

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **State Management & Data Fetching**: TanStack React Query
- **Form Management**: React Hook Form + Zod resolvers
- **Internationalization**: `i18next` + `react-i18next`
- **Time/Date Utils**: `date-fns` + `date-fns-tz`

---

## 📁 Repository Structure

```text
├── src/                 # Express backend API source code
│   ├── config/          # Database & app configs
│   ├── controllers/     # Route controller endpoints
│   ├── middleware/      # Auth gates, validations, error-handling
│   ├── routes/          # API route definitions
│   ├── services/        # PDF generators and logic
│   └── index.ts         # Server entry point
├── frontend/            # React + Vite client source code
│   ├── src/
│   │   ├── components/  # Layout wrappers, Spinner, and route gates
│   │   ├── context/     # React Context providers (AuthContext)
│   │   ├── pages/       # Dashboard, Invoices, Clients, Settings, Login, Register
│   │   ├── services/    # Axios API client wrapper
│   │   ├── utils/       # Timezone dates and currency formatting helpers
│   │   ├── i18n.ts      # Internationalization dictionaries setup
│   │   └── main.tsx     # SPA bootstrap entry
│   └── index.html
├── prisma/              # Prisma DB schemas & connection files
└── LICENSE              # Open source license details
```

---

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (running locally or remote instance)
- **npm** or **yarn**

---

## 🔧 Installation & Local Setup

Follow these steps to run the full-stack project locally:

### 1. Clone the Repository
```bash
git clone https://github.com/feliciopedro/invoice_app.git
cd invoice_app
```

### 2. Configure Environment Variables
Copy `.env.example` in the root directory to `.env` and fill in your database and environment settings:
```bash
cp .env.example .env
```
Key configurations inside `.env`:
- `DATABASE_URL="postgresql://username:password@localhost:5432/invoice_generator_db"`
- `JWT_SECRET="your_secure_jwt_secret"`
- `PORT=3000`

### 3. Setup the Backend API
Install root dependencies, synchronize the database schema using Prisma, and start the development server:
```bash
# Install dependencies
npm install

# Generate Prisma Client & push the database structure to PostgreSQL
npx prisma generate
npx prisma db push

# Run the backend dev server
npm run dev
```
The API will run at `http://localhost:3000`.

### 4. Setup the Frontend SPA
In a new terminal window, navigate to the `frontend/` directory, install its packages, and start Vite:
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
The React application will run at `http://localhost:5173`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/feliciopedro/invoice_app/issues).

---

## 📄 License

This project is open-source and licensed under the **[MIT License](file:///c:/Users/Felicio%20Pedro%20Junior/Projects/INVOICE/LICENSE)**.