<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=30&duration=3000&pause=1000&color=E74C3C&center=true&vCenter=true&width=700&lines=💉+VitalConnect;Organ+Donation+Management+System;Saving+Lives+Through+Technology" alt="Typing SVG" />

<br/>

<!-- Tech Stack Badges -->
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![PDFKit](https://img.shields.io/badge/PDFKit-Certificates-FF4500?style=for-the-badge&logo=adobe&logoColor=white)

<br/>

<!-- Status Badges -->
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-orange?style=flat-square)
![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red?style=flat-square)
![DBMS Project](https://img.shields.io/badge/Academic-DBMS%20Project-purple?style=flat-square)

<br/><br/>

> **VitalConnect** is a full-stack Organ Donation Management and Certification System built with React, Node.js, and MySQL.  
> It connects donors, hospitals, and administrators on a single platform — enabling seamless organ matching and certified donation workflows.

<br/>

[![View Repository](https://img.shields.io/badge/⭐%20Star%20this%20Repo-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/UditSamanta/VitalConnect-Organ-Donation-Management-and-Certification-System)
[![Report Bug](https://img.shields.io/badge/🐛%20Report%20Bug-Issues-red?style=for-the-badge)](https://github.com/UditSamanta/VitalConnect-Organ-Donation-Management-and-Certification-System/issues)
[![Request Feature](https://img.shields.io/badge/✨%20Request%20Feature-Discuss-blueviolet?style=for-the-badge)](https://github.com/UditSamanta/VitalConnect-Organ-Donation-Management-and-Certification-System/issues)

</div>

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Database Design](#-database-design)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Demo Credentials](#-demo-login-credentials)
- [DBMS Concepts Used](#-dbms-concepts-used)

---

## 🧠 About the Project

<details>
<summary><b>📖 Click to read — What is VitalConnect?</b></summary>

<br/>

**VitalConnect** is an end-to-end web platform that digitizes the organ donation lifecycle:

- 🧑 **Donors** register their willingness to donate specific organs, track their approval status, and download official PDF donation certificates.
- 🏥 **Hospitals** submit requests for specific organs with blood group and urgency details.
- 🛡️ **Admins** review donor profiles, approve or reject registrations, view real-time analytics, and trigger automated organ matching.

The system was built as a **DBMS college project**, showcasing real-world database concepts like normalization, concurrency control, transaction management, and relational integrity.

</details>

---

## 🛠️ Tech Stack

<details>
<summary><b>⚙️ Click to expand — Full Tech Stack Breakdown</b></summary>

<br/>

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite | SPA with fast HMR dev experience |
| **Styling** | TailwindCSS 3 | Utility-first responsive UI |
| **Backend** | Node.js + Express.js | RESTful API server |
| **Database** | MySQL 8.0 | Relational data storage (3NF normalized) |
| **Auth** | JWT + bcryptjs | Stateless auth with hashed passwords |
| **PDF Engine** | PDFKit | Server-side PDF certificate generation |
| **HTTP Client** | Axios | Frontend → Backend API calls |
| **Dev Server** | Vite | Fast frontend dev & build tool |

</details>

---

## ✨ Features

<details>
<summary><b>🔐 Click to expand — Authentication & Security</b></summary>

<br/>

- 🔑 **JWT-based Authentication** — Stateless, secure token sessions
- 🔒 **bcrypt Password Hashing** — Passwords never stored in plaintext
- 🛡️ **Role-Based Access Control (RBAC)** — Three distinct roles: `donor`, `hospital`, `admin`
- 🚫 **Protected Routes** — Frontend route guards + backend middleware
- 📋 **Input Validation** — Server-side data sanitization on all endpoints

</details>

<details>
<summary><b>🩸 Click to expand — Donor Features</b></summary>

<br/>

- 📝 Register as a donor with personal details, blood group, and selected organs
- 📊 Real-time approval status tracking (Pending / Approved / Rejected)
- 📄 Download official **PDF Donation Certificate** upon approval
- ✏️ Update profile and organ preferences at any time
- 🔔 Dashboard showing current registration status

</details>

<details>
<summary><b>🏥 Click to expand — Hospital Features</b></summary>

<br/>

- 🏗️ Register hospital profile with name, address, and license details
- 📨 Submit organ requests specifying organ type, blood group, and urgency
- 📋 Track submitted request statuses
- 🔍 View matched donor information upon successful match

</details>

<details>
<summary><b>🛡️ Click to expand — Admin Features</b></summary>

<br/>

- 📊 **Live Dashboard Analytics** — Total donors, hospitals, requests, matches
- 👥 Browse and search all registered donors
- ✅ **Approve / ❌ Reject** donor applications with one click
- 🔄 **Auto Organ Matching** — Triggered on approval, matches by blood group + organ type
- 📈 Platform-wide statistics and reporting

</details>

<details>
<summary><b>🤖 Click to expand — Organ Matching Algorithm</b></summary>

<br/>

The matching engine (`backend/src/utils/matching.js`) runs automatically when an admin approves a donor:

1. Fetches donor's blood group + list of organs they're donating
2. Queries `organ_requests` for pending requests matching:
   - Same organ type
   - Compatible blood group
3. Creates entries in the `matches` table
4. Marks matched requests as fulfilled

**Matching priority:** First-come, first-served among pending requests.

</details>

---

## 🏗️ System Architecture

<details>
<summary><b>📐 Click to expand — Architecture Overview</b></summary>

<br/>

```
┌─────────────────────────────────────────────────────┐
│                     CLIENT SIDE                      │
│                                                     │
│  React 19 + Vite + TailwindCSS                      │
│  ┌──────────┐ ┌───────────┐ ┌──────────────────┐   │
│  │ Landing  │ │  Auth     │ │   Dashboards     │   │
│  │  Page    │ │ Login /   │ │ Donor / Hospital │   │
│  │          │ │ Register  │ │ / Admin          │   │
│  └──────────┘ └───────────┘ └──────────────────┘   │
│                     │ Axios HTTP                     │
└─────────────────────┼───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                    API SERVER                        │
│                                                     │
│  Node.js + Express.js  (Port 5000)                  │
│  ┌──────┐ ┌────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Auth │ │ Donor  │ │ Hospital │ │    Admin    │  │
│  │ Routes│ │ Routes │ │  Routes  │ │   Routes   │  │
│  └──────┘ └────────┘ └──────────┘ └─────────────┘  │
│        │ JWT Middleware + bcrypt Auth                │
└────────┼────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────┐
│                  DATABASE LAYER                      │
│                                                     │
│  MySQL 8.0                                          │
│  users → donors → hospitals → organ_requests        │
│                            → matches → certificates  │
└─────────────────────────────────────────────────────┘
```

</details>

---

## 🗃️ Database Design

<details>
<summary><b>📊 Click to expand — Schema & Tables</b></summary>

<br/>

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `users` | Core auth table | `id`, `name`, `email`, `password_hash`, `role` |
| `donors` | Donor profiles | `user_id`, `blood_group`, `organs` (JSON), `status` |
| `hospitals` | Hospital profiles | `user_id`, `hospital_name`, `license_no`, `address` |
| `organ_requests` | Hospital organ requests | `hospital_id`, `organ_type`, `blood_group`, `status` |
| `matches` | Donor ↔ Request links | `donor_id`, `request_id`, `matched_at` |
| `certificates` | Issued certificates | `donor_id`, `issued_at`, `certificate_no` |

**Normalization:** Schema is in **3rd Normal Form (3NF)** — no transitive dependencies.

**Referential Integrity:** All foreign keys use `ON DELETE CASCADE` to maintain consistency.

</details>

<details>
<summary><b>🔄 Click to expand — DBMS Concepts Implemented</b></summary>

<br/>

| Concept | Where Used |
|---------|-----------|
| **3NF Normalization** | All 6 tables follow 3rd Normal Form |
| **Transactions** | Donor approval + matching runs as a single atomic transaction |
| **Concurrency Control** | MySQL InnoDB row-level locking during match assignment |
| **Referential Integrity** | FK constraints with CASCADE rules across all relations |
| **Indexing** | Indexed on `email`, `blood_group`, `status` for fast queries |
| **Stored Procedures** | Used for bulk matching logic |
| **Connection Pooling** | MySQL2 pool with configurable size in `db.js` |

</details>

---

## 🔌 API Reference

<details>
<summary><b>📡 Click to expand — All API Endpoints</b></summary>

<br/>

### 🔐 Auth Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | None | Register new user |
| `POST` | `/api/auth/login` | None | Login & get JWT |

### 🩸 Donor Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/donor/register` | `donor` | Create donor profile |
| `GET` | `/api/donor/profile` | `donor` | Get own profile |
| `PUT` | `/api/donor/update` | `donor` | Update donor details |

### 🏥 Hospital Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/hospital/register` | `hospital` | Create hospital profile |
| `POST` | `/api/hospital/request` | `hospital` | Submit organ request |
| `GET` | `/api/hospital/requests` | `hospital` | List own requests |

### 🛡️ Admin Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/donors` | `admin` | List all donors |
| `PUT` | `/api/admin/approve-donor/:id` | `admin` | Approve or reject donor |
| `GET` | `/api/admin/stats` | `admin` | Dashboard statistics |

### 📄 Certificate Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/certificate/download/:id` | `donor` | Download PDF certificate |

### ❤️ Health Check
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | None | Server status |

</details>

---

## 📂 Project Structure

<details>
<summary><b>🗂️ Click to expand — Full Directory Structure</b></summary>

<br/>

```
VitalConnect/
│
├── 📄 README.md
├── 📄 .gitignore
│
├── 📁 database/
│   ├── schema.sql              # MySQL schema — 3NF normalized tables
│   └── sample_data.sql         # Seed data with 500+ donor records
│
├── 📁 backend/
│   ├── package.json
│   ├── .env.example            # Environment variable template
│   ├── bulk_seed.js            # Script to populate bulk test data
│   └── src/
│       ├── server.js           # Express app entry point
│       ├── config/
│       │   └── db.js           # MySQL connection pool setup
│       ├── middleware/
│       │   └── auth.js         # JWT verification middleware
│       ├── routes/
│       │   ├── auth.js         # Register & Login
│       │   ├── donor.js        # Donor profile & management
│       │   ├── hospital.js     # Hospital portal & requests
│       │   ├── admin.js        # Admin controls & analytics
│       │   └── certificate.js  # PDF certificate generation
│       └── utils/
│           └── matching.js     # Organ matching algorithm
│
├── 📁 frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── App.jsx             # Routes & layout
│       ├── index.css           # Global styles
│       ├── context/
│       │   └── AuthContext.jsx # Global auth state (React Context)
│       ├── lib/
│       │   └── api.js          # Axios instance & API helpers
│       ├── components/
│       │   ├── Navbar.jsx      # Navigation bar
│       │   └── ProtectedRoute.jsx  # Route guard component
│       └── pages/
│           ├── Landing.jsx         # Public homepage
│           ├── Login.jsx           # Login page
│           ├── Register.jsx        # Registration page
│           ├── DonorDashboard.jsx  # Donor portal
│           ├── HospitalDashboard.jsx # Hospital portal
│           ├── AdminDashboard.jsx  # Admin control panel
│           └── Certificate.jsx     # PDF certificate viewer
│
└── 📁 docs/
    └── dbms_report.md          # Full academic DBMS project report
```

</details>

---

## 🚀 Getting Started

<details>
<summary><b>⚙️ Click to expand — Prerequisites</b></summary>

<br/>

Make sure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| MySQL | 8.0+ | [mysql.com](https://dev.mysql.com/downloads/) |
| npm | v9+ | Comes with Node.js |
| Git | Latest | [git-scm.com](https://git-scm.com) |

</details>

<details>
<summary><b>🗄️ Click to expand — Step 1: Database Setup</b></summary>

<br/>

Open your MySQL shell or MySQL Workbench and run:

```sql
-- Create and select the database
CREATE DATABASE IF NOT EXISTS organ_donation_db;
USE organ_donation_db;

-- Load the schema (creates all tables)
SOURCE /path/to/database/schema.sql;

-- Load sample data (500+ donors, hospitals, requests)
SOURCE /path/to/database/sample_data.sql;
```

</details>

<details>
<summary><b>🖥️ Click to expand — Step 2: Backend Setup</b></summary>

<br/>

```bash
# Navigate to the backend
cd backend

# Install dependencies
npm install

# Create your .env file from the template
cp .env.example .env
```

Edit `.env` and fill in your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=organ_donation_db
JWT_SECRET=your_secret_key_here
PORT=5000
```

Start the backend server:

```bash
node src/server.js
```

✅ Backend running at **http://localhost:5000**

</details>

<details>
<summary><b>🌐 Click to expand — Step 3: Frontend Setup</b></summary>

<br/>

```bash
# Navigate to the frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

✅ Frontend running at **http://localhost:5173**

</details>

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 🛡️ **Admin** | `admin@odms.com` | `Admin@123` |
| 🩸 **Donor** | `rahul@example.com` | `Admin@123` |
| 🏥 **Hospital** | `aiims@example.com` | `Admin@123` |

> ⚠️ All sample accounts use password `Admin@123`

---

## 🎓 DBMS Concepts Used

<details>
<summary><b>📚 Click to expand — Academic DBMS Concepts Demonstrated</b></summary>

<br/>

This project was built to demonstrate the following DBMS concepts:

#### 📐 Normalization
- All tables conform to **3rd Normal Form (3NF)**
- No partial or transitive functional dependencies
- Decomposed properly using functional dependency analysis

#### 🔒 Concurrency Control
- MySQL **InnoDB engine** with row-level locking
- Prevents race conditions during simultaneous donor approvals
- Uses `SELECT ... FOR UPDATE` during matching to lock rows

#### 💾 Transaction Management
- Donor approval + organ matching wrapped in a single **ACID transaction**
- On any failure, the entire operation **rolls back** atomically

#### 🔗 Referential Integrity
- All foreign keys defined with `ON DELETE CASCADE`
- Ensures no orphan records exist across tables

#### ⚡ Indexing & Query Optimization
- Indexes on frequently queried columns: `email`, `blood_group`, `status`
- Query optimization using `EXPLAIN` to minimize full table scans

#### 🗃️ Connection Pooling
- MySQL2 connection pool (`db.js`) handles concurrent API requests efficiently

</details>

---

<div align="center">

**Made with ❤️ by [Udit Samanta](https://github.com/UditSamanta)**

*VitalConnect — Connecting lives through technology*

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=UditSamanta.VitalConnect-Organ-Donation-Management-and-Certification-System)

</div>
