# SMG Employee Portal - Enterprise Dealer Management System (DMS)

Welcome to the **SMG Employee Portal**, an Enterprise-Grade Dealer Management System (DMS) designed for e-scooter dealerships. It features a complete MERN stack built with TypeScript, TailwindCSS, and Shadcn UI styling.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js v18+](https://nodejs.org/)
- [MongoDB Server](https://www.mongodb.com/) (running locally at `mongodb://127.0.0.1:27017` or Atlas connection)
- [Redis Server](https://redis.io/) (optional, has automatic In-Memory caching fallback)

---

## 🛠️ Run Locally (Development)

### 1. Run Backend API
```bash
cd backend
npm install
npm run dev
```
- Server starts at: `http://localhost:5000`
- API version endpoint: `/api/v1`
- The database is seeded on start with default roles and accounts.

### 2. Run Frontend SPA Client
```bash
cd frontend
npm install
npm run dev
```
- Client starts at: `http://localhost:5173` (or matches your Vite environment port)

---

## 🐳 Docker Deployment
Run the entire platform including MongoDB and Redis automatically:
```bash
docker-compose up --build
```
- Frontend access: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## 🔑 Seeding & Credentials

Upon launch, the database is auto-seeded with default role permissions and mock credentials. The standard password for all accounts is: **`password123`**.

| Role Name | Username/User ID | Description & Modules Accessible |
| :--- | :--- | :--- |
| **Master Admin** | `masteradmin` | Full control across all modules & settings |
| **Pre Sales Manager** | `presalesmanager` | Leads, Call Logs, Test Rides, Quotations |
| **Sales Manager** | `salesmanager` | Retail/Corporate Sales, Accessories, Inventory |
| **After Sales Manager** | `aftersalesmanager` | HSRP Booking, Part/Scooter Warranty Claims |
| **Purchase Manager** | `purchasemanager` | Purchase Orders, PDI verification sheet logs |
| **Service Officer** | `servicetechnicianofficer` | Service records, job cards, AMC, roadside logs |

---

## 📊 Feature Highlights
1. **2FA Simulation**: Logins require entering a 6-digit OTP code, which is logged directly to the backend console in development.
2. **WebSocket Tracking**: Live service statuses are broadcasted via Socket.io allowing instant tracking of chassis progress stages.
3. **Caching**: Redis caches aggregated dashboard analytics with automatic 5-minute invalidation.
4. **Document Management (DMS)**: Local upload, indexing, and version history of compliance PDFs (Warranty forms, PDI sheets, PO invoices).
