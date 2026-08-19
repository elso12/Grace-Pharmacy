# Grace Pharmacy - Enterprise Pharmacy Management System

![Grace Pharmacy Hero Image](https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=1200)

**Grace Pharmacy** is a modern, enterprise-grade B2B and B2C pharmacy management platform. It offers a stunning patient-facing storefront, a high-speed cashier Point of Sale (POS) system, and a robust administrative backend featuring automated First-Expire, First-Out (FEFO) inventory management and Role-Based Access Control (RBAC).

## ✨ Key Features

- **🛡️ Granular Role-Based Access Control (RBAC):** Distinct dashboards and capabilities mapped directly to staff roles (`ADMIN`, `PHARMACIST`, `TECHNICIAN`, `CASHIER`, `CUSTOMER`). Security spans from the React Router layout layer down to the backend Express routes.
- **📦 Intelligent FEFO Inventory Engine:** The backend dispensing algorithm automatically routes orders to deduct from the oldest (nearest to expiry) medication batches first. This minimizes expired waste and adheres to strict pharmaceutical regulatory standards.
- **💳 Split-Screen POS (Point of Sale):** A high-speed, cache-optimized POS interface built for cashiers. Features quick-add functionality, receipt printing, and live stock deduction.
- **🛒 Customer Web Storefront:** A beautiful, responsive eCommerce interface allowing patients to browse medications, add to a global shopping cart, and securely check out. Includes a private customer portal for order history.
- **📊 Real-time Analytics Dashboard:** Instantly visualizes total revenue, pending orders, and alerts administrators to low-stock or expiring medication batches.

## 🛠️ Technology Stack

**Frontend:**
- React 18 + Vite (TypeScript)
- Tailwind CSS (Utility-first styling, custom color palettes, glassmorphism)
- Context API (Cart & Auth Global State)
- Lucide React (Icons)
- React Router DOM

**Backend:**
- Node.js + Express (TypeScript)
- MongoDB + Mongoose (Advanced aggregation, document references)
- JWT Authentication

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or MongoDB Atlas)
- NPM or Yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/elso12/Grace-Pharmacy.git
   cd Grace-Pharmacy
   ```

2. **Setup the Backend:**
   ```bash
   cd server
   npm install
   # Create a .env file and set PORT=5000, MONGODB_URI=your_uri, JWT_SECRET=your_secret
   npm run dev
   ```

3. **Setup the Frontend:**
   ```bash
   cd client
   npm install
   # Create a .env file and set VITE_API_URL=http://localhost:5000/api
   npm run dev
   ```

## 📸 System Previews

### 1. Point of Sale (POS) Interface
*High-velocity cashier interface with live FEFO cart deduction and physical receipt printing.*

### 2. FEFO Inventory Dashboard
*Enterprise data tables sorting batches by closest expiry. Includes conditional styling (Red = Expired, Yellow = Expiring Soon).*

### 3. Customer Storefront
*Modern, clean layout for B2C interactions featuring medical-aesthetic blues and soft grays.*

---
*Developed with modern software architecture principles, focusing on separation of concerns, strict typing, and elegant user experience.*
