# 🏥 Organ Donation Management System (ODMS)

> A full-stack web application for organ donation management — built as a DBMS college project.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **MySQL** 8.0+
- **npm**

---

## 1. Database Setup

Open MySQL shell or MySQL Workbench and run:

```sql
-- Step 1: Create tables
SOURCE C:/Users/udits/.gemini/antigravity/scratch/organ-donation-system/database/schema.sql

-- Step 2: Insert sample data
SOURCE C:/Users/udits/.gemini/antigravity/scratch/organ-donation-system/database/sample_data.sql
```

---

## 2. Backend Setup

```bash
cd organ-donation-system/backend
```

Edit `.env` — set your MySQL password:
```
DB_PASSWORD=your_mysql_password_here
```

Start the server:
```bash
node src/server.js
```

Backend runs at: **http://localhost:5000**

---

## 3. Frontend Setup

```bash
cd organ-donation-system/frontend
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@odms.com | Admin@123 |
| **Donor** | rahul@example.com | Admin@123 |
| **Hospital** | aiims@example.com | Admin@123 |

> All sample accounts use password `Admin@123`

---

## 📂 Project Structure

```
organ-donation-system/
├── database/
│   ├── schema.sql          # MySQL schema (3NF normalized)
│   └── sample_data.sql     # Seed data with demo accounts
├── backend/
│   ├── src/
│   │   ├── config/db.js    # MySQL connection pool
│   │   ├── middleware/     # JWT auth middleware
│   │   ├── routes/         # API route handlers
│   │   │   ├── auth.js
│   │   │   ├── donor.js
│   │   │   ├── hospital.js
│   │   │   ├── admin.js
│   │   │   └── certificate.js
│   │   ├── utils/
│   │   │   └── matching.js # Organ matching algorithm
│   │   └── server.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/AuthContext.jsx
    │   ├── lib/api.js
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── Landing.jsx
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── DonorDashboard.jsx
    │       ├── HospitalDashboard.jsx
    │       ├── AdminDashboard.jsx
    │       └── Certificate.jsx
    ├── .env
    └── package.json
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register user |
| POST | `/api/auth/login` | None | Login |
| POST | `/api/donor/register` | donor | Create donor profile |
| GET | `/api/donor/profile` | donor | Get own profile |
| PUT | `/api/donor/update` | donor | Update donor profile |
| POST | `/api/hospital/register` | hospital | Create hospital profile |
| POST | `/api/hospital/request` | hospital | Submit organ request |
| GET | `/api/hospital/requests` | hospital | List own requests |
| GET | `/api/admin/donors` | admin | List all donors |
| PUT | `/api/admin/approve-donor/:id` | admin | Approve/reject donor |
| GET | `/api/admin/stats` | admin | Dashboard stats |
| GET | `/api/certificate/download/:id` | donor | Download PDF certificate |
| GET | `/api/health` | None | Health check |

---

## 🗃️ Database Tables

| Table | Description |
|-------|-------------|
| `users` | Authentication: name, email, password, role |
| `donors` | Donor profiles: age, blood group, organs (JSON) |
| `hospitals` | Hospital profiles: name, address, license |
| `organ_requests` | Organ requests from hospitals |
| `matches` | Donor ↔ Request matching records |
| `certificates` | Issued donor certificates |

---

## ✨ Features

- **Role-based auth** — Donor / Hospital / Admin
- **JWT authentication** — Secure token-based sessions
- **Organ matching** — Auto-matched when admin approves a donor
- **PDF certificates** — Generated with PDFKit on approval
- **Admin dashboard** — Search, approve/reject donors, analytics
- **Hospital portal** — Submit and track organ requests
- **Donor portal** — Profile management, status tracking

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TailwindCSS 3 |
| Backend | Node.js, Express.js |
| Database | MySQL 8 |
| Auth | JWT (jsonwebtoken, bcryptjs) |
| PDF | PDFKit |
| HTTP Client | Axios |
