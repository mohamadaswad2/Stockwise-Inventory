# StockWise — SaaS Inventory Management System

A production-ready, multi-tenant inventory management system built with **Next.js**, **Node.js/Express**, and **PostgreSQL**.

---

## Folder Structure

```
inventory-saas/
├── client/                         # Next.js 14 frontend
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── dashboard/
│   │   │   ├── StatsGrid.jsx
│   │   │   └── LowStockTable.jsx
│   │   ├── inventory/
│   │   │   ├── ItemForm.jsx
│   │   │   ├── ItemTable.jsx
│   │   │   └── InventoryFilters.jsx
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── ui/
│   │       ├── Spinner.jsx
│   │       ├── Modal.jsx
│   │       ├── ConfirmDialog.jsx
│   │       ├── EmptyState.jsx
│   │       └── StatCard.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useInventory.js
│   │   ├── useDashboard.js
│   │   └── useCategories.js
│   ├── pages/
│   │   ├── _app.jsx
│   │   ├── _document.jsx
│   │   ├── index.jsx
│   │   ├── auth/
│   │   │   ├── login.jsx
│   │   │   └── register.jsx
│   │   ├── dashboard/
│   │   │   └── index.jsx
│   │   └── inventory/
│   │       └── index.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.service.js
│   │   ├── inventory.service.js
│   │   └── dashboard.service.js
│   ├── styles/
│   │   └── globals.css
│   ├── .env.example
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── server/                         # Node.js + Express backend
    ├── src/
    │   ├── index.js                # Entry point
    │   ├── app.js                  # Express app factory
    │   ├── config/
    │   │   ├── database.js         # pg Pool
    │   │   ├── migrate.js          # npm run db:migrate
    │   │   └── seed.js             # npm run db:seed
    │   ├── controllers/
    │   │   ├── auth.controller.js
    │   │   ├── inventory.controller.js
    │   │   ├── dashboard.controller.js
    │   │   ├── category.controller.js
    │   │   └── user.controller.js
    │   ├── services/
    │   │   ├── auth.service.js
    │   │   ├── inventory.service.js
    │   │   ├── dashboard.service.js
    │   │   └── category.service.js
    │   ├── repositories/
    │   │   ├── user.repository.js
    │   │   ├── inventory.repository.js
    │   │   └── category.repository.js
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── inventory.routes.js
    │   │   ├── dashboard.routes.js
    │   │   └── user.routes.js
    │   ├── middlewares/
    │   │   ├── auth.middleware.js
    │   │   ├── error.middleware.js
    │   │   └── validate.middleware.js
    │   ├── validations/
    │   │   ├── auth.validation.js
    │   │   └── inventory.validation.js
    │   └── utils/
    │       ├── response.js
    │       └── AppError.js
    ├── .env.example
    └── package.json
```

---

## Prerequisites

| Tool       | Version    | Install link |
|------------|------------|--------------|
| Node.js    | 18+ (LTS)  | https://nodejs.org |
| npm        | 9+         | Comes with Node |
| PostgreSQL | 14+        | https://postgresql.org/download |

---

## Setup & Installation Guide

### Step 1 — Clone / extract the project

```bash
# If from git:
git clone <your-repo-url> inventory-saas
cd inventory-saas
```

---

### Step 2 — Set up PostgreSQL

**macOS (Homebrew)**
```bash
brew install postgresql@16
brew services start postgresql@16
psql postgres -c "CREATE DATABASE inventory_saas;"
psql postgres -c "CREATE USER inventory_user WITH PASSWORD 'yourpassword';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE inventory_saas TO inventory_user;"
```

**Ubuntu / Debian**
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE inventory_saas;"
sudo -u postgres psql -c "CREATE USER inventory_user WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE inventory_saas TO inventory_user;"
```

**Windows**
Download and run the installer from https://postgresql.org/download/windows, then use pgAdmin or psql to create the database.

---

### Step 3 — Configure environment variables

**Server**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_saas
DB_USER=inventory_user
DB_PASSWORD=yourpassword

JWT_SECRET=replace_with_a_long_random_string_at_least_32_chars
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:3000
```

> Generate a secure JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

**Client**
```bash
cd ../client
cp .env.example .env.local
```

Edit `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### Step 4 — Install dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

---

### Step 5 — Run database migrations

```bash
cd server
npm run db:migrate
```

This creates all tables: `users`, `categories`, `inventory_items`, `subscriptions`.

---

### Step 6 — (Optional) Seed demo data

```bash
npm run db:seed
```

Creates a demo user with sample inventory items:
- **Email:** `demo@inventorysaas.com`
- **Password:** `demo1234`

---

### Step 7 — Start the servers

Open two terminal windows:

**Terminal 1 — Backend**
```bash
cd server
npm run dev
# → Server running on http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd client
npm run dev
# → App running on http://localhost:3000
```

Open http://localhost:3000 in your browser.

---

## API Reference

All responses follow this consistent format:

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "message": "...", "errors": [ ... ] }
```

### Auth Endpoints

| Method | Endpoint              | Auth | Description        |
|--------|-----------------------|------|--------------------|
| POST   | /api/auth/register    | No   | Create new account |
| POST   | /api/auth/login       | No   | Login              |
| POST   | /api/auth/logout      | Yes  | Logout             |
| GET    | /api/auth/profile     | Yes  | Get own profile    |

### Inventory Endpoints

| Method | Endpoint                        | Auth | Description           |
|--------|---------------------------------|------|-----------------------|
| GET    | /api/inventory                  | Yes  | List items (paginated)|
| POST   | /api/inventory                  | Yes  | Create item           |
| GET    | /api/inventory/:id              | Yes  | Get single item       |
| PUT    | /api/inventory/:id              | Yes  | Update item           |
| DELETE | /api/inventory/:id              | Yes  | Soft-delete item      |
| GET    | /api/inventory/categories       | Yes  | List categories       |
| POST   | /api/inventory/categories       | Yes  | Create category       |
| DELETE | /api/inventory/categories/:id   | Yes  | Delete category       |

**Query params for GET /api/inventory:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `search` — searches name and SKU
- `category_id` — filter by category UUID
- `low_stock` — `true` to show only low-stock items

### Dashboard Endpoints

| Method | Endpoint              | Auth | Description          |
|--------|-----------------------|------|----------------------|
| GET    | /api/dashboard/stats  | Yes  | Get aggregated stats |

### User Endpoints

| Method | Endpoint       | Auth | Description         |
|--------|----------------|------|---------------------|
| GET    | /api/users/me  | Yes  | Get current user    |
| PATCH  | /api/users/me  | Yes  | Update profile name |

---

## Architecture Notes

### Multi-Tenancy
Every database query is scoped by `user_id`. There is no shared data between tenants. The `authenticate` middleware attaches `req.user` (with `id`) to every protected request, and all repositories accept `userId` as a required parameter.

### Request Flow
```
HTTP Request
  → Rate Limiter
  → Auth Middleware (verifies JWT, attaches req.user)
  → Validation Middleware (Joi schema)
  → Controller (thin — calls service, formats response)
  → Service (business logic, throws AppError on failure)
  → Repository (raw SQL, scoped to user_id)
  → PostgreSQL
```

### Error Handling
All errors bubble up to `errorHandler` middleware in `app.js`. Services throw `new AppError(message, statusCode)` for expected errors. Unexpected errors fall through with a 500 response. Stack traces are only shown in development mode.

### Subscription-Ready Structure
The `users` table has a `plan` column (`free`, `pro`, `enterprise`). A `subscriptions` table exists for future payment provider webhooks. To add plan-gating, read `req.user.plan` in a middleware and throw `AppError('Upgrade required', 402)`.

---

## Troubleshooting

**Port already in use**
```bash
# Find and kill the process using port 5000
lsof -ti:5000 | xargs kill -9
# Or change PORT in server/.env
```

**Database connection failed**
- Verify PostgreSQL is running: `pg_isready -h localhost`
- Check credentials in `server/.env` match your PostgreSQL setup
- Ensure the database exists: `psql -U postgres -l | grep inventory_saas`

**JWT errors (401 on all requests)**
- Ensure `JWT_SECRET` in `server/.env` is set and non-empty
- Clear browser localStorage and log in again

**Next.js CORS errors**
- Confirm `CLIENT_URL` in `server/.env` matches exactly where Next.js is running (default `http://localhost:3000`)
- Confirm `NEXT_PUBLIC_API_URL` in `client/.env.local` is `http://localhost:5000/api`

**Migration fails**
- Ensure `gen_random_uuid()` is available: requires PostgreSQL 13+ or the `pgcrypto` extension
- Run: `psql -d inventory_saas -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"`
