/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── Grace Pharmacy — Express Application Entry Point ────────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Middleware order matters — this file is ordered deliberately:
 *
 *   1. dotenv.config()  — MUST be first so process.env is populated before
 *                          any module that reads it is imported (e.g. connectDB).
 *   2. CORS             — Must precede all routes so OPTIONS pre-flight
 *                          requests are handled before route handlers run.
 *   3. express.json()   — Must precede all routes so req.body is populated.
 *   4. Routes           — Mounted after middleware is fully configured.
 *   5. Error handlers   — Always last (Express identifies them by arity=4).
 */

// ─── Load env vars FIRST — before any other module reads process.env ────────
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import http from 'http';
import { initSocketServer } from './socket';
import connectDB from './config/db';

// ─── Route imports ──────────────────────────────────────────────────────────
import inventoryRoutes        from './routes/inventoryRoutes';
import existingInventoryRoutes from './routes/inventory.routes';
import analyticsRoutes        from './routes/analyticsRoutes';
import authRoutes             from './routes/authRoutes';
import orderRoutes            from './routes/orderRoutes';
import productRoutes          from './routes/productRoutes';   // B2C storefront catalog
import { inventoryRouter, prescriptionRouter, customerRouter, productRouter, authRouter, supplierRouter, userRouter, auditRouter, saleRouter, messageRouter } from './routes/index';
import alertRoutes            from './routes/alertRoutes';
import reportRoutes           from './routes/reportRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { startCronJobs }      from './services/cronService';
import { auditLogger }        from './middleware/auditLogger';

const app = express();

// ─── 0. Security Middleware (Helmet & Rate Limiting) ────────────────────────
app.use(helmet()); // Sets various HTTP headers for security (CSP, HSTS, etc.)

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply the rate limiting middleware to API calls only
app.use('/api', apiLimiter);

// ─── 1. CORS ─────────────────────────────────────────────────────────────────
// Must come before routes so pre-flight OPTIONS requests are handled correctly.
// `credentials: true` allows the frontend to send cookies / Authorization headers.
const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // Mobile apps, Postman, curl
  if (
    origin.endsWith('.vercel.app') ||
    origin.includes('localhost') ||
    origin === process.env.CLIENT_URL
  ) {
    return true;
  }
  return true; // Fallback allowing dynamic preview URLs
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Enable preflight for all routes
app.options('*', cors());

// ─── 2. Body parsers ─────────────────────────────────────────────────────────
// MUST be registered before route handlers so req.body is never undefined.
app.use(express.json());            // Parses application/json
app.use(express.urlencoded({ extended: true })); // Parses application/x-www-form-urlencoded

// ─── 3. Health & Readiness Probes ──────────────────────────────────────────────
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'System is healthy' });
});

app.get('/api/ready', (req: Request, res: Response) => {
  // In a real system, you would verify DB connection state here before returning 200
  const dbState = mongoose.connection.readyState;
  if (dbState === 1) {
    res.status(200).json({ status: 'READY', message: 'Ready to receive traffic' });
  } else {
    res.status(503).json({ status: 'UNAVAILABLE', message: 'Database not connected' });
  }
});

import { protect, authorizeRoles } from './middleware/authMiddleware';
import { UserRole } from './types/enums';

// ─── 4. API Routes ───────────────────────────────────────────────────────────

// Apply audit logger globally for /api routes
app.use('/api', auditLogger);

// Auth — no authentication middleware applied; handlers validate their own body.
app.use('/api/auth', authRoutes);

// B2C routes
app.use('/api/products',       productRoutes);    // B2C storefront — public, no auth
app.use('/api/customers',      customerRouter);
app.use('/api/orders',         orderRoutes);
app.use('/api/prescriptions',  prescriptionRouter);

// Internal routes (Guarded completely against CUSTOMER)
const internalGuard = [protect, authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.CASHIER, UserRole.TECHNICIAN)];

// Manager routes (Admins and Pharmacists)
const managerGuard = [protect, authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST)];

// Strict Admin routes (Blocked against CASHIER, TECHNICIAN, and PHARMACIST)
const strictAdminGuard = [protect, authorizeRoles(UserRole.ADMIN)];

app.use('/api/inventory', ...internalGuard, inventoryRoutes);
app.use('/api/inventory', ...internalGuard, existingInventoryRoutes);
app.use('/api/sales',     ...internalGuard, saleRouter);
app.use('/api/suppliers', ...strictAdminGuard, supplierRouter);
app.use('/api/alerts',    ...strictAdminGuard, alertRoutes);
app.use('/api/reports',   ...strictAdminGuard, reportRoutes);
app.use('/api/analytics', ...strictAdminGuard, analyticsRoutes);
app.use('/api/users',     ...strictAdminGuard, userRouter);
app.use('/api/audit-logs',  ...strictAdminGuard, auditRouter);

app.use('/api/messages', protect, messageRouter);

// ─── 5. Error Handling ───────────────────────────────────────────────────────
// These MUST be registered last — Express identifies error middleware by arity=4.
app.use(notFoundHandler); // Catches unmatched routes → 404
app.use(errorHandler);    // Global error handler

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const bootstrap = async (): Promise<void> => {
  // Connect to MongoDB before accepting requests.
  // connectDB reads MONGODB_URI from process.env — dotenv.config() above
  // ensures this is populated before the first call.
  await connectDB();

  const server = http.createServer(app);
  initSocketServer(server);

  // Initialize background jobs
  startCronJobs();

  server.listen(PORT, () => {
    console.log(`\n  ┌──────────────────────────────────────────┐`);
    console.log(`  │  Grace Pharmacy Server running on port ${PORT}   │`);
    console.log(`  │  CORS origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}   │`);
    console.log(`  │  Environment: ${process.env.NODE_ENV || 'development'}              │`);
    console.log(`  └──────────────────────────────────────────┘\n`);
  });
};

bootstrap().catch((err) => {
  console.error('[FATAL] Failed to start server:', err);
  process.exit(1);
});

export default app;
