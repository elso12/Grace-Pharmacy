# 🏥 Grace Pharmacy — Enterprise Pharmacy Management System

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Preview-emerald?style=for-the-badge&logo=vercel)](https://grace-pharmacy.vercel.app)
[![Repository](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/elso12/Grace-Pharmacy)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

An enterprise-grade B2B & B2C pharmacy management platform engineered to automate clinical pharmaceutical workflows, enforce strict 5-tier Role-Based Access Control (RBAC), and eliminate medication expiration waste through an automated **First-Expire, First-Out (FEFO)** dispensing engine.

---

## 🌐 Live Production Links

* **Frontend Application:** [https://grace-pharmacy.vercel.app](https://grace-pharmacy.vercel.app)
* **Backend REST API:** [https://grace-pharmacy.onrender.com](https://grace-pharmacy.onrender.com)
* **Source Code Repository:** [https://github.com/elso12/Grace-Pharmacy](https://github.com/elso12/Grace-Pharmacy)

### Demo Accounts for Evaluation (Password: `Grace@12345`)
| Role | Email | Key Capabilities |
| :--- | :--- | :--- |
| **👑 Admin** | `admin@gracepharmacy.com` | Real-time financial analytics, staff provisioning, audit trails, and product CRUD |
| **🥼 Pharmacist** | `pharmacist@gracepharmacy.com` | Rx verification, drug interaction safety checks, digital signing, and FEFO batch tracking |
| **📦 Technician** | `technician@gracepharmacy.com` | Order pick-lists with shelf mapping (Aisle/Bin), packaging, and stock cycle counts |
| **💵 Cashier** | `cashier@gracepharmacy.com` | High-speed POS terminal, multi-payment processing, receipt printing, and returns |
| **👤 Customer** | `customer@example.com` | Storefront browsing, cart checkout, live order tracking stepper, and 1-click refills |

---

## 🏗️ System Architecture

                              ┌────────────────────────────────────────┐
                              │            CLIENT APPLICATION          │
                              │     React 18 • Vite • TypeScript       │
                              │     Tailwind CSS • Context API         │
                              └───────────────────┬────────────────────┘
                                                  │ HTTPS / WSS
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │             BACKEND ENGINE             │
                              │      Node.js • Express • Socket.io     │
                              ├────────────────────────────────────────┤
                              │  • Rate Limiting & Helmet Security     │
                              │  • JWT Authentication & RBAC Guards    │
                              │  • FEFO Inventory Allocation Engine    │
                              │  • Drug Interaction Safety Service     │
                              └───────────────────┬────────────────────┘
                                                  │ TLS / SCRAM-SHA-256
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │             DATABASE LAYER             │
                              │     MongoDB Atlas M0 ReplicaSet        │
                              │     Compound Indexing & Aggregations   │
                              └────────────────────────────────────────┘

---

## 🌟 Core Technical Highlights

### 1. Intelligent FEFO (First-Expire, First-Out) Engine
Rather than standard FIFO (First-In, First-Out), the dispensing service dynamically queries unexpired active batches sorted ascending by `expiryDate` (`{ expiryDate: 1 }`). During POS checkout or customer orders, stock is automatically allocated from the nearest-to-expire batch first, preventing expired medication write-offs.

### 2. Multi-Tier Role-Based Access Control (RBAC)
Security is enforced using a defense-in-depth model:
* **Frontend:** Declarative route guards (`<ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']} />`) prevent unauthorized navigation.
* **Backend:** Express middleware (`verifyToken` + `requireRole([...])`) validates cryptographically signed JWTs and tenant role claims on every protected endpoint.

### 3. Clinical Safety & Digital Authorization
* **Drug-Drug Interaction Analysis:** Algorithms evaluate medication combinations and return clinical alerts (Contraindicated, Warning, Safe) prior to approval.
* **Tamper-Evident Digital Signing:** Pharmacists attach cryptographically verified digital signatures with license numbers to approved orders before fulfillment.

### 4. Real-Time Inter-Role Communication
Powered by Socket.io, staff and patients communicate in real time across departments (Admin, Pharmacist, Technician, Cashier, Customer) with live presence and in-app notifications.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM, Context API |
| **Backend** | Node.js, Express.js (TypeScript), Socket.io, Zod, BcryptJS, JWT |
| **Database** | MongoDB Atlas, Mongoose ODM (with compound indexing & aggregations) |
| **DevOps & Hosting** | Docker, Docker Compose, Vercel (Frontend), Render (Backend), GitHub Actions (CI) |
| **Testing** | Vitest, Supertest |

---

## 🚀 Local Development Setup

### Prerequisites
* Node.js v18+
* MongoDB (local instance or MongoDB Atlas URI)

### Installation
```bash
# Clone the repository
git clone https://github.com/elso12/Grace-Pharmacy.git
cd Grace-Pharmacy

# Install all dependencies (Monorepo)
npm install
cd client && npm install && cd ../server && npm install && cd ..

# Configure Environment Variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Seed the database with sample medications and test accounts
npm run seed --prefix server

# Start both frontend and backend concurrently
npm run dev
```

---

### Step 3: The 60–90 Second Interview Pitch

When a recruiter or engineering manager asks:  
**"Can you walk me through one of your best full-stack projects?"**

Use this structured pitch:

> *"I recently architected and deployed **Grace Pharmacy**, an enterprise-grade pharmacy management system built with React, TypeScript, Node.js, Express, and MongoDB.*
>
> *The core engineering problem I solved was **pharmaceutical inventory waste**. Instead of standard FIFO, I engineered an automated **FEFO (First-Expire, First-Out) allocation engine** that routes sales to deduct from the oldest unexpired batches first.*
>
> *On the security side, I implemented a strict 5-tier RBAC system spanning from React Router guards down to Express JWT middleware, dividing permissions across Admins, Pharmacists, Technicians, Cashiers, and Customers.*
>
> *I also built a split-screen Cashier POS, real-time clinical verification with drug-interaction checks, and WebSockets for live inter-department messaging. The entire application is deployed in production with the frontend on Vercel, the backend on Render, and data hosted on a multi-node MongoDB Atlas replica set."*

---

### Step 4: Technical Deep-Dive Answers (For Pair Programming & System Design Rounds)

#### Q: "Why did you choose MongoDB over a Relational Database for this project?"
* **Answer:** *"Medications and prescriptions vary significantly in structure (e.g., dosage forms, active ingredients, varying batch counts, and prescription attachments). MongoDB's flexible document model allowed us to embed medication line items within orders while maintaining references to parent products and batches. For analytics, MongoDB's aggregation pipeline allowed us to compute daily revenue and low-stock metrics efficiently using single-pass index scans."*

#### Q: "How do you prevent race conditions when two users buy the last batch item simultaneously?"
* **Answer:** *"In our dispensing controller, we utilize atomic conditional updates in MongoDB: `{ _id: batchId, quantity: { $gte: requestedQty } }` with `$inc: { quantity: -requestedQty }`. If another cashier or customer attempts to decrement the same batch concurrently, the second update fails the `$gte` condition and triggers an immediate rollback or re-routes to the next FEFO batch."*
