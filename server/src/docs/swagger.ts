/**
 * ─── Grace Pharmacy — OpenAPI 3.0 Specification ───────────────────────────
 *
 * Hand-crafted OpenAPI spec for the Grace Pharmacy (PharmFlow) REST API.
 * Covers core endpoints across Authentication, Products, Inventory,
 * Prescriptions, Orders, and POS domains.
 *
 * Mounted at /api/docs via swagger-ui-express in app.ts.
 */

import type { JsonObject } from 'swagger-ui-express';

export const swaggerSpec: JsonObject = {
  openapi: '3.0.3',

  // ═══════════════════════════════════════════════════════════════════════════
  // INFO
  // ═══════════════════════════════════════════════════════════════════════════
  info: {
    title: 'Grace Pharmacy (PharmFlow) API',
    version: '1.0.0',
    description:
      'Enterprise pharmacy management system API. Supports B2C storefront, ' +
      'POS checkout, FEFO inventory management, prescription verification, ' +
      'and role-based access control.',
    contact: {
      name: 'Grace Pharmacy Engineering',
      email: 'dev@gracepharmacy.com',
    },
    license: {
      name: 'MIT',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVERS
  // ═══════════════════════════════════════════════════════════════════════════
  servers: [
    { url: '/api', description: 'Default API prefix' },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY SCHEMES
  // ═══════════════════════════════════════════════════════════════════════════
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter a valid JWT obtained from POST /auth/login',
      },
    },
    schemas: {
      // ─── Error Response ─────────────────────────────────────────────
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
        },
      },

      // ─── Auth ───────────────────────────────────────────────────────
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email', example: 'admin@gracepharmacy.com' },
          password: { type: 'string', minLength: 8, example: 'Admin@123' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          name:      { type: 'string', example: 'Jane Doe' },
          firstName: { type: 'string', example: 'Jane' },
          lastName:  { type: 'string', example: 'Doe' },
          email:     { type: 'string', format: 'email', example: 'jane@example.com' },
          password:  { type: 'string', minLength: 8, example: 'Secure@123' },
          role:      { type: 'string', enum: ['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER', 'CUSTOMER'] },
          phone:     { type: 'string', example: '+254700000000' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          status:  { type: 'string', example: 'success' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id:        { type: 'string' },
                  firstName: { type: 'string' },
                  lastName:  { type: 'string' },
                  email:     { type: 'string' },
                  role:      { type: 'string' },
                  isActive:  { type: 'boolean' },
                },
              },
            },
          },
        },
      },

      // ─── Product ────────────────────────────────────────────────────
      CreateProductRequest: {
        type: 'object',
        required: ['name', 'genericName', 'category', 'unitPrice'],
        properties: {
          name:                 { type: 'string', example: 'Amoxicillin' },
          genericName:          { type: 'string', example: 'amoxicillin' },
          category:             { type: 'string', enum: ['PRESCRIPTION', 'OTC', 'CONTROLLED', 'SUPPLEMENT', 'MEDICAL_DEVICE', 'COSMETIC', 'OTHER'] },
          dosageForm:           { type: 'string', example: 'Capsule' },
          strength:             { type: 'string', example: '500mg' },
          unitPrice:            { type: 'number', minimum: 0.01, example: 12.50 },
          requiresPrescription: { type: 'boolean', default: false },
          reorderLevel:         { type: 'integer', default: 10 },
        },
      },
      ProductListResponse: {
        type: 'object',
        properties: {
          status:     { type: 'string', example: 'success' },
          count:      { type: 'integer' },
          totalCount: { type: 'integer' },
          data:       { type: 'array', items: { type: 'object' } },
        },
      },

      // ─── Inventory Batch ────────────────────────────────────────────
      CreateBatchRequest: {
        type: 'object',
        required: ['productId', 'batchNumber', 'quantity', 'expiryDate', 'costPrice', 'sellingPrice'],
        properties: {
          productId:    { type: 'string', example: '507f1f77bcf86cd799439011' },
          batchNumber:  { type: 'string', example: 'LOT-2026-001' },
          quantity:     { type: 'integer', minimum: 1, example: 100 },
          expiryDate:   { type: 'string', format: 'date-time', example: '2027-12-31T00:00:00.000Z' },
          costPrice:    { type: 'number', minimum: 0, example: 5.00 },
          sellingPrice: { type: 'number', minimum: 0, example: 12.50 },
          supplierId:   { type: 'string' },
          notes:        { type: 'string' },
        },
      },

      // ─── Order / Checkout ───────────────────────────────────────────
      CheckoutRequest: {
        type: 'object',
        required: ['items', 'fulfillmentType', 'paymentMethod'],
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['medicationId', 'quantity'],
              properties: {
                medicationId: { type: 'string' },
                quantity:     { type: 'integer', minimum: 1 },
              },
            },
          },
          fulfillmentType: { type: 'string', enum: ['PICKUP', 'DELIVERY'] },
          paymentMethod:   { type: 'string', enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'INSURANCE', 'MOBILE_PAYMENT'] },
          shippingAddress: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city:   { type: 'string' },
              zip:    { type: 'string' },
            },
          },
        },
      },

      // ─── POS Sale ───────────────────────────────────────────────────
      PosSaleRequest: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['medicationId', 'quantity'],
              properties: {
                medicationId: { type: 'string' },
                quantity:     { type: 'integer', minimum: 1 },
              },
            },
          },
          paymentMethod:  { type: 'string', enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'INSURANCE', 'MOBILE_PAYMENT'], default: 'CASH' },
          prescriptionId: { type: 'string' },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAGS
  // ═══════════════════════════════════════════════════════════════════════════
  tags: [
    { name: 'Authentication',  description: 'User registration, login, and password management' },
    { name: 'Products',        description: 'Medication catalog (B2C storefront + admin CRUD)' },
    { name: 'Inventory',       description: 'FEFO batch management, dispense engine, and alerts' },
    { name: 'Orders',          description: 'B2C checkout, order lifecycle, and fulfillment' },
    { name: 'POS',             description: 'Point-of-sale in-store transactions' },
    { name: 'Prescriptions',   description: 'Prescription verification, approval, and refills' },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // PATHS
  // ═══════════════════════════════════════════════════════════════════════════
  paths: {
    // ─── Auth ─────────────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        description: 'Authenticates a user and returns a signed JWT. Both "user not found" and "wrong password" return identical 401 responses to prevent user enumeration.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Validation error (missing/malformed fields)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        description: 'Creates a new user with hashed password and returns a JWT. Supports both `{ name }` and `{ firstName, lastName }` body shapes.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Validation error' },
          409: { description: 'Email already registered' },
        },
      },
    },

    // ─── Products ─────────────────────────────────────────────────────
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products (public storefront)',
        description: 'Returns paginated product list with computed `totalAvailableStock` from active inventory batches.',
        parameters: [
          { name: 'page',     in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',    in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search',   in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Product list', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductListResponse' } } } },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create a new product',
        security: [{ BearerAuth: [] }],
        description: 'Creates a product in the catalog. Requires ADMIN or PHARMACIST role.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProductRequest' } } },
        },
        responses: {
          201: { description: 'Product created' },
          400: { description: 'Validation error' },
          401: { description: 'Not authenticated' },
          403: { description: 'Insufficient role' },
        },
      },
    },

    // ─── Inventory ────────────────────────────────────────────────────
    '/inventory/batch': {
      post: {
        tags: ['Inventory'],
        summary: 'Add a new inventory batch',
        security: [{ BearerAuth: [] }],
        description: 'Receives a new shipment into inventory. Expiry date must be in the future. Requires ADMIN or PHARMACIST role.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBatchRequest' } } },
        },
        responses: {
          201: { description: 'Batch created' },
          400: { description: 'Validation error' },
          401: { description: 'Not authenticated' },
          403: { description: 'Insufficient role' },
        },
      },
    },
    '/inventory/fefo-dispense': {
      get: {
        tags: ['Inventory'],
        summary: 'FEFO dispense plan (dry-run or commit)',
        security: [{ BearerAuth: [] }],
        description: 'Calculates optimal batch deductions using First-Expired-First-Out. Pass `commit=true` to deduct atomically.',
        parameters: [
          { name: 'productId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'quantity',  in: 'query', required: true, schema: { type: 'integer', minimum: 1 } },
          { name: 'commit',    in: 'query', schema: { type: 'boolean', default: false } },
        ],
        responses: {
          200: { description: 'Dispense plan with batch deductions' },
          404: { description: 'Product not found' },
        },
      },
    },
    '/inventory/alerts/expiry': {
      get: {
        tags: ['Inventory'],
        summary: 'Batches expiring within N days',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'integer', default: 30 } },
        ],
        responses: {
          200: { description: 'Expiry alert list with urgency classification' },
        },
      },
    },

    // ─── Orders ───────────────────────────────────────────────────────
    '/orders/checkout': {
      post: {
        tags: ['Orders'],
        summary: 'B2C checkout — create an order',
        security: [{ BearerAuth: [] }],
        description: 'Creates an order with FEFO stock verification. Requires CUSTOMER or ADMIN role. Validates prescription requirements.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckoutRequest' } } },
        },
        responses: {
          201: { description: 'Order created' },
          400: { description: 'Validation error / insufficient stock / prescription required' },
          401: { description: 'Not authenticated' },
        },
      },
    },
    '/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status',
        security: [{ BearerAuth: [] }],
        description: 'Transitions order through the fulfillment lifecycle. Triggers FEFO deduction on PENDING→PROCESSING.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'PACKED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Status updated' },
          403: { description: 'Prescription not approved / role not authorized' },
          404: { description: 'Order not found' },
        },
      },
    },

    // ─── POS ──────────────────────────────────────────────────────────
    '/sales/pos': {
      post: {
        tags: ['POS'],
        summary: 'POS checkout — in-store sale',
        security: [{ BearerAuth: [] }],
        description: 'Processes an in-store sale. Validates prescription status if prescriptionId is provided. Requires CASHIER, PHARMACIST, or ADMIN role.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PosSaleRequest' } } },
        },
        responses: {
          201: { description: 'Sale processed' },
          400: { description: 'Validation error / prescription not approved' },
          401: { description: 'Not authenticated' },
          403: { description: 'Insufficient role' },
        },
      },
    },

    // ─── Prescriptions ────────────────────────────────────────────────
    '/prescriptions/queue': {
      get: {
        tags: ['Prescriptions'],
        summary: 'Pharmacist prescription queue',
        security: [{ BearerAuth: [] }],
        description: 'Returns all prescriptions pending pharmacist review. Requires ADMIN or PHARMACIST role.',
        responses: {
          200: { description: 'Prescription queue' },
          401: { description: 'Not authenticated' },
          403: { description: 'Insufficient role' },
        },
      },
    },
    '/prescriptions/{id}/approve': {
      post: {
        tags: ['Prescriptions'],
        summary: 'Approve a prescription',
        security: [{ BearerAuth: [] }],
        description: 'Pharmacist approves a pending prescription for dispensing. Requires ADMIN or PHARMACIST role.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Prescription approved' },
          400: { description: 'Already approved / not pending' },
          404: { description: 'Prescription not found' },
        },
      },
    },
  },
};
