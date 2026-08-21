import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const ATLAS_URI =
  'mongodb+srv://elsobtube_db_user:gracepharmacy123@cluster0.3hissgh.mongodb.net/pharmflow?retryWrites=true&w=majority&appName=Cluster0';

const MONGO_URI =
  process.env.MONGO_URI && !process.env.MONGO_URI.includes('mongo:')
    ? process.env.MONGO_URI
    : ATLAS_URI;

async function seedMasterDatabase() {
  try {
    const cleanUri = MONGO_URI.trim().replace(/^["']|["']$/g, '');
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(cleanUri);
    console.log('Connected successfully.\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection instance undefined');

    // 1. Clean existing collections
    console.log('Cleaning old collections for a fresh seed...');
    const collections = [
      'users',
      'products',
      'inventorybatches',
      'orders',
      'sales',
      'prescriptions',
      'consultations',
      'auditlogs',
      'alerts',
      'customers'
    ];
    for (const name of collections) {
      try {
        await db.collection(name).drop();
      } catch {
        // Safe to ignore if collection does not exist
      }
    }

    const defaultPassword = 'Grace@12345';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const now = new Date();
    const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
    const daysFuture = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

    // 2. Seed Users across all 5 roles
    console.log('Seeding Staff and Customer Accounts...');
    const users = [
      {
        name: 'Dr. Sarah Jenkins',
        email: 'admin@gracepharmacy.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Marcus Vance, PharmD',
        email: 'pharmacist@gracepharmacy.com',
        password: hashedPassword,
        role: 'PHARMACIST',
        isActive: true,
        createdAt: daysAgo(45),
        updatedAt: now,
      },
      {
        name: 'David Chen (Lead Tech)',
        email: 'technician@gracepharmacy.com',
        password: hashedPassword,
        role: 'TECHNICIAN',
        isActive: true,
        createdAt: daysAgo(30),
        updatedAt: now,
      },
      {
        name: 'Elena Gomez (Senior Cashier)',
        email: 'cashier@gracepharmacy.com',
        password: hashedPassword,
        role: 'CASHIER',
        isActive: true,
        createdAt: daysAgo(30),
        updatedAt: now,
      },
      {
        name: 'John Doe (Patient)',
        email: 'customer@example.com',
        password: hashedPassword,
        role: 'CUSTOMER',
        isActive: true,
        phone: '+1 (555) 234-5678',
        address: '742 Evergreen Terrace, Springfield',
        createdAt: daysAgo(90),
        updatedAt: now,
      },
      {
        name: 'Jane Smith (Patient)',
        email: 'jane.smith@example.com',
        password: hashedPassword,
        role: 'CUSTOMER',
        isActive: true,
        phone: '+1 (555) 876-5432',
        address: '123 Baker Street, London',
        createdAt: daysAgo(60),
        updatedAt: now,
      },
    ];
    const userResult = await db.collection('users').insertMany(users);
    const userIds = Object.values(userResult.insertedIds);
    console.log(` Created ${userResult.insertedCount} user accounts.`);

    // 3. Seed Medication Products
    console.log('Seeding Product Catalog...');
    const products = [
      {
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin Trihydrate',
        category: 'Antibiotics',
        form: 'Capsule',
        strength: '500mg',
        unitPrice: 18.5,
        costPrice: 8.5,
        requiresPrescription: true,
        minStockThreshold: 30,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        description: 'Broad-spectrum penicillin antibiotic for bacterial infections.',
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Paracetamol 500mg (Panadol)',
        genericName: 'Acetaminophen',
        category: 'Pain Relief',
        form: 'Tablet',
        strength: '500mg',
        unitPrice: 6.0,
        costPrice: 2.2,
        requiresPrescription: false,
        minStockThreshold: 50,
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
        description: 'Pain reliever and fever reducer.',
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Ibuprofen 400mg (Advil)',
        genericName: 'Ibuprofen',
        category: 'Pain Relief',
        form: 'Tablet',
        strength: '400mg',
        unitPrice: 8.75,
        costPrice: 3.5,
        requiresPrescription: false,
        minStockThreshold: 40,
        imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400',
        description: 'NSAID for pain, inflammation, and fever.',
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Lipitor 20mg',
        genericName: 'Atorvastatin Calcium',
        category: 'Cardiovascular',
        form: 'Tablet',
        strength: '20mg',
        unitPrice: 34.0,
        costPrice: 16.0,
        requiresPrescription: true,
        minStockThreshold: 20,
        imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
        description: 'Statin to lower bad cholesterol (LDL).',
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Ventolin HFA Inhaler',
        genericName: 'Albuterol Sulfate',
        category: 'Respiratory',
        form: 'Inhaler',
        strength: '90mcg/actuation',
        unitPrice: 42.5,
        costPrice: 21.0,
        requiresPrescription: true,
        minStockThreshold: 15,
        imageUrl: 'https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=400',
        description: 'Fast-acting bronchodilator for asthma relief.',
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Vitamin C 1000mg + Zinc',
        genericName: 'Ascorbic Acid & Zinc',
        category: 'Vitamins & Supplements',
        form: 'Effervescent Tablet',
        strength: '1000mg',
        unitPrice: 12.0,
        costPrice: 4.8,
        requiresPrescription: false,
        minStockThreshold: 25,
        imageUrl: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400',
        description: 'Immune support supplement.',
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Methotrexate 2.5mg',
        genericName: 'Methotrexate',
        category: 'Immunosuppressant',
        form: 'Tablet',
        strength: '2.5mg',
        unitPrice: 25.0,
        costPrice: 10.0,
        requiresPrescription: true,
        minStockThreshold: 10,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        description: 'Used to treat certain types of cancer and autoimmune diseases.',
        createdAt: daysAgo(60),
        updatedAt: now,
      }
    ];
    const productResult = await db.collection('products').insertMany(products);
    const productIds = Object.values(productResult.insertedIds);
    console.log(` Created ${productResult.insertedCount} products.`);

    // 4. Seed FEFO Inventory Batches (Staggered Expirations)
    console.log('Seeding FEFO Inventory Batches...');
    const batches = [
      // Amoxicillin - Batch 1: Near expiry (<30 days -> FEFO priority #1)
      {
        productId: productIds[0],
        batchNumber: 'AMX-2026-EXP-SOON',
        quantity: 15,
        costPrice: 8.5,
        expiryDate: daysFuture(25),
        shelfLocation: 'Aisle 1, Shelf A, Bin 04',
        status: 'ACTIVE',
        createdAt: daysAgo(30),
      },
      // Amoxicillin - Batch 2: Fresh batch
      {
        productId: productIds[0],
        batchNumber: 'AMX-2026-FRESH',
        quantity: 120,
        costPrice: 8.5,
        expiryDate: daysFuture(450),
        shelfLocation: 'Aisle 1, Shelf A, Bin 05',
        status: 'ACTIVE',
        createdAt: daysAgo(10),
      },
      // Paracetamol
      {
        productId: productIds[1],
        batchNumber: 'PAN-2026-01',
        quantity: 180,
        costPrice: 2.2,
        expiryDate: daysFuture(500),
        shelfLocation: 'Aisle 2, Shelf B, Bin 12',
        status: 'ACTIVE',
        createdAt: daysAgo(15),
      },
      // Ibuprofen - Warning batch (<60 days)
      {
        productId: productIds[2],
        batchNumber: 'IBU-2026-WARN',
        quantity: 25,
        costPrice: 3.5,
        expiryDate: daysFuture(50),
        shelfLocation: 'Aisle 2, Shelf C, Bin 03',
        status: 'ACTIVE',
        createdAt: daysAgo(20),
      },
      // Lipitor
      {
        productId: productIds[3],
        batchNumber: 'LIP-2026-88',
        quantity: 50,
        costPrice: 16.0,
        expiryDate: daysFuture(320),
        shelfLocation: 'Aisle 3, Shelf A, Bin 01',
        status: 'ACTIVE',
        createdAt: daysAgo(12),
      },
      // Ventolin
      {
        productId: productIds[4],
        batchNumber: 'VEN-2026-02',
        quantity: 35,
        costPrice: 21.0,
        expiryDate: daysFuture(280),
        shelfLocation: 'Aisle 4, Shelf D, Bin 08',
        status: 'ACTIVE',
        createdAt: daysAgo(8),
      },
      // Vitamin C
      {
        productId: productIds[5],
        batchNumber: 'VIT-2026-77',
        quantity: 90,
        costPrice: 4.8,
        expiryDate: daysFuture(600),
        shelfLocation: 'Aisle 5, Shelf A, Bin 10',
        status: 'ACTIVE',
        createdAt: daysAgo(5),
      }
    ];
    await db.collection('inventorybatches').insertMany(batches);
    console.log(' Created 7 FEFO-staggered inventory batches.');

    // 4.5 Seed Customers (Patients)
    console.log('Seeding Customers/Patients...');
    const customers = [
      {
        _id: userIds[4],
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1 (555) 234-5678',
        email: 'customer@example.com',
        allergies: [],
        medicalConditions: ['Hypertension'],
        isActive: true,
        notes: `\n--- [${daysAgo(3).toISOString()}] by Marcus Vance, PharmD (PHARMACIST) ---\nPatient informed about taking Amoxicillin with meals to prevent gastrointestinal upset. Advised to complete full 7-day course.`,
        createdAt: daysAgo(90),
        updatedAt: now,
      },
      {
        _id: userIds[5],
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1 (555) 876-5432',
        email: 'jane.smith@example.com',
        allergies: [{ substance: 'Penicillin', severity: 'SEVERE' }],
        medicalConditions: ['Asthma'],
        isActive: true,
        notes: '',
        createdAt: daysAgo(60),
        updatedAt: now,
      }
    ];
    await db.collection('customers').insertMany(customers);
    console.log(` Created 2 customers.`);

    // 5. Seed Prescriptions (For Pharmacist & Technician views)
    console.log('Seeding Prescriptions for Clinical & Fulfillment Queues...');
    const prescriptions = [
      {
        prescriptionNumber: 'RX-2026-001',
        patient: userIds[4], // John Doe
        patientName: 'John Doe',
        doctor: { name: 'Dr. Robert Vance, MD', licenseNumber: 'MD-77281' },
        doctorName: 'Dr. Robert Vance, MD',
        doctorLicenseNumber: 'MD-77281',
        medications: [
          { product: { _id: productIds[0], name: 'Amoxicillin 500mg' }, name: 'Amoxicillin 500mg', dosage: '500mg', frequency: '3 times daily', duration: '7 days', quantity: 21 },
          { product: { _id: productIds[6], name: 'Methotrexate 2.5mg' }, name: 'Methotrexate 2.5mg', dosage: '2.5mg', frequency: 'Once weekly', duration: '30 days', quantity: 10 },
        ],
        prescriptionImageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600',
        status: 'PENDING_VERIFICATION',
        priority: 'NORMAL',
        prescriptionDate: daysAgo(1),
        submittedAt: daysAgo(1),
        createdAt: daysAgo(1),
      },
      {
        prescriptionNumber: 'RX-2026-002',
        patient: userIds[5], // Jane Smith
        patientName: 'Jane Smith',
        doctor: { name: 'Dr. Emily Alva, MD', licenseNumber: 'MD-90412' },
        doctorName: 'Dr. Emily Alva, MD',
        doctorLicenseNumber: 'MD-90412',
        medications: [
          { product: { _id: productIds[4], name: 'Ventolin HFA Inhaler' }, name: 'Ventolin HFA Inhaler', dosage: '90mcg', frequency: '2 puffs every 4-6 hours', duration: '30 days', quantity: 1 },
          { product: { _id: productIds[1], name: 'Paracetamol 500mg' }, name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'Every 6 hours PRN', duration: '5 days', quantity: 20 },
        ],
        prescriptionImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600',
        status: 'APPROVED',
        priority: 'URGENT',
        prescriptionDate: daysAgo(2),
        verificationDetails: {
          verifiedBy: userIds[1], // Pharmacist
          verifiedAt: daysAgo(1),
          digitalSignature: 'Signed by Marcus Vance, PharmD | Lic# PH-99201 | SHA256-VALIDATED',
          clinicalNotes: 'Patient instructed on proper inhaler priming and spacer usage.',
        },
        verifiedBy: userIds[1], // Pharmacist
        verifiedAt: daysAgo(1),
        digitalSignature: 'Signed by Marcus Vance, PharmD | Lic# PH-99201 | SHA256-VALIDATED',
        clinicalNotes: 'Patient instructed on proper inhaler priming and spacer usage.',
        submittedAt: daysAgo(2),
        createdAt: daysAgo(2),
      },
      {
        prescriptionNumber: 'RX-2026-003',
        patient: userIds[4],
        patientName: 'John Doe',
        doctor: { name: 'Dr. Sarah Adams, MD', licenseNumber: 'MD-44109' },
        doctorName: 'Dr. Sarah Adams, MD',
        doctorLicenseNumber: 'MD-44109',
        medications: [
          { product: { _id: productIds[3], name: 'Lipitor 20mg' }, name: 'Lipitor 20mg', dosage: '20mg', frequency: 'Once daily at bedtime', duration: '90 days', quantity: 90 },
        ],
        prescriptionDate: daysAgo(4),
        status: 'PREPARED',
        verificationDetails: {
          verifiedBy: userIds[1], // Pharmacist
          verifiedAt: daysAgo(3),
          digitalSignature: 'Signed by Marcus Vance, PharmD | Lic# PH-99201',
        },
        verifiedBy: userIds[1],
        verifiedAt: daysAgo(3),
        digitalSignature: 'Signed by Marcus Vance, PharmD | Lic# PH-99201',
        preparedBy: userIds[2], // Technician
        preparedAt: daysAgo(2),
        submittedAt: daysAgo(4),
        createdAt: daysAgo(4),
      },
    ];
    await db.collection('prescriptions').insertMany(prescriptions);
    console.log(' Created 3 sample prescriptions in different workflow states.');

    // 6. Seed Historical Orders & Completed Sales (For Admin Analytics & POS Receipts)
    console.log('Seeding Sales & Transactions for Revenue Analytics...');
    const sales = [
      {
        receiptNumber: 'REC-2026-1001',
        invoiceNumber: 'INV-10001',
        cashierId: userIds[3], // Elena Cashier
        cashierName: 'Elena Gomez',
        customerName: 'Walk-in Customer',
        items: [
          { product: productIds[1], productName: 'Paracetamol 500mg', quantity: 2, unitPrice: 6.0, lineTotal: 12.0 },
          { product: productIds[5], productName: 'Vitamin C 1000mg + Zinc', quantity: 1, unitPrice: 12.0, lineTotal: 12.0 },
        ],
        subtotal: 24.0,
        taxAmount: 1.92,
        totalAmount: 25.92,
        amountPaid: 30.0,
        paymentMethod: 'CASH',
        amountTendered: 30.0,
        changeDue: 4.08,
        changeGiven: 4.08,
        status: 'COMPLETED',
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1)
      },
      {
        receiptNumber: 'REC-2026-1002',
        invoiceNumber: 'INV-10002',
        cashierId: userIds[3],
        cashierName: 'Elena Gomez',
        customerName: 'John Doe',
        items: [
          { product: productIds[2], productName: 'Ibuprofen 400mg', quantity: 2, unitPrice: 8.75, lineTotal: 17.5 },
          { product: productIds[4], productName: 'Ventolin HFA Inhaler', quantity: 1, unitPrice: 42.5, lineTotal: 42.5 },
        ],
        subtotal: 60.0,
        taxAmount: 4.8,
        totalAmount: 64.8,
        amountPaid: 64.8,
        paymentMethod: 'CREDIT_CARD',
        status: 'COMPLETED',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },
      {
        receiptNumber: 'REC-2026-1003',
        invoiceNumber: 'INV-10003',
        cashierId: userIds[3],
        cashierName: 'Elena Gomez',
        customerName: 'Jane Smith',
        items: [
          { product: productIds[3], productName: 'Lipitor 20mg', quantity: 1, unitPrice: 34.0, lineTotal: 34.0 },
        ],
        subtotal: 34.0,
        taxAmount: 2.72,
        totalAmount: 36.72,
        amountPaid: 36.72,
        paymentMethod: 'MOBILE_MONEY',
        status: 'COMPLETED',
        createdAt: now,
        updatedAt: now
      },
    ];
    await db.collection('sales').insertMany(sales);
    await db.collection('orders').insertMany(sales);
    console.log(' Created historical POS transactions and order records.');

    // 7. Seed System Audit Logs (For Admin Security View)
    console.log('Seeding Audit Trail Logs...');
    const auditLogs = [
      {
        actorId: userIds[0],
        actorName: 'Dr. Sarah Jenkins',
        actorRole: 'ADMIN',
        action: 'USER_CREATED',
        targetEntity: 'User',
        details: { msg: 'Provisioned new staff account: Elena Gomez (CASHIER)' },
        ipAddress: '192.168.1.10',
        timestamp: daysAgo(30),
      },
      {
        actorId: userIds[1],
        actorName: 'Marcus Vance, PharmD',
        actorRole: 'PHARMACIST',
        action: 'PRESCRIPTION_APPROVED',
        targetEntity: 'Prescription',
        details: { msg: 'Approved and digitally signed prescription for Jane Smith (Ventolin Inhaler)' },
        ipAddress: '192.168.1.14',
        timestamp: daysAgo(1),
      },
      {
        actorId: userIds[0],
        actorName: 'Dr. Sarah Jenkins',
        actorRole: 'ADMIN',
        action: 'BATCH_STOCK_ADDED',
        targetEntity: 'InventoryBatch',
        details: { msg: 'Logged shipment batch AMX-2026-FRESH (120 units Amoxicillin)' },
        ipAddress: '192.168.1.10',
        timestamp: daysAgo(10),
      },
    ];
    await db.collection('auditlogs').insertMany(auditLogs);
    console.log(' Created system audit trail records.');

    console.log('\n──────────────────────────────────────────────────────────');
    console.log('✅ Master Database Seeding Completed Successfully!');
    console.log('──────────────────────────────────────────────────────────');
    console.log('Password for ALL accounts: Grace@12345\n');
    console.log('Role Test Accounts:');
    console.log(' 1. ADMIN:       admin@gracepharmacy.com');
    console.log(' 2. PHARMACIST:  pharmacist@gracepharmacy.com');
    console.log(' 3. TECHNICIAN:  technician@gracepharmacy.com');
    console.log(' 4. CASHIER:     cashier@gracepharmacy.com');
    console.log(' 5. CUSTOMER:    customer@example.com');
    console.log('──────────────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
}

seedMasterDatabase();
