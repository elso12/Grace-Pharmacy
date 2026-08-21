import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// 1. Configure environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Live MongoDB Atlas URI
const ATLAS_URI =
  'mongodb+srv://elsobtube_db_user:gracepharmacy123@cluster0.3hissgh.mongodb.net/pharmflow?retryWrites=true&w=majority&appName=Cluster0';

// Use Atlas if local env has the Docker 'mongo:27017' host
const MONGO_URI =
  process.env.MONGO_URI && !process.env.MONGO_URI.includes('mongo:')
    ? process.env.MONGO_URI
    : ATLAS_URI;

if (!MONGO_URI) {
  console.error('❌ Error: No database URI found in environment variables.');
  process.exit(1);
}

async function seed() {
  try {
    const cleanUri = MONGO_URI!.trim().replace(/^["']|["']$/g, '');
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(cleanUri);
    console.log('Connected successfully.\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection instance is undefined');

    // 2. Clean existing collections to ensure an idempotent, clean reset
    console.log('Cleaning old collections...');
    const collectionsToDrop = ['users', 'products', 'inventorybatches', 'orders', 'sales', 'alerts', 'auditlogs'];
    for (const name of collectionsToDrop) {
      try {
        await db.collection(name).drop();
      } catch {
        // Safe to ignore if collection does not exist
      }
    }

    // 3. Hash default password for all demo accounts
    const defaultPassword = 'Grace@12345';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const now = new Date();

    // 4. Seed Staff & Customer Users across all 5 RBAC roles
    console.log('Seeding Staff and Customer Accounts...');
    const users = [
      {
        name: 'Dr. Sarah Jenkins (Admin)',
        email: 'admin@gracepharmacy.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Marcus Vance, PharmD',
        email: 'pharmacist@gracepharmacy.com',
        password: hashedPassword,
        role: 'PHARMACIST',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'David Chen (Technician)',
        email: 'technician@gracepharmacy.com',
        password: hashedPassword,
        role: 'TECHNICIAN',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Elena Gomez (Cashier)',
        email: 'cashier@gracepharmacy.com',
        password: hashedPassword,
        role: 'CASHIER',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'John Doe (Patient)',
        email: 'customer@example.com',
        password: hashedPassword,
        role: 'CUSTOMER',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    const userResult = await db.collection('users').insertMany(users);
    console.log(` Created ${userResult.insertedCount} user accounts.`);

    // 5. Seed Comprehensive Pharmaceutical Products
    console.log('Seeding Medication Catalog...');
    const products = [
      {
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin Trihydrate',
        category: 'Antibiotics',
        form: 'Capsule',
        strength: '500mg',
        unitPrice: 18.5,
        requiresPrescription: true,
        minStockThreshold: 30,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        description: 'Broad-spectrum penicillin antibiotic used to treat bacterial infections.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Paracetamol 500mg (Panadol)',
        genericName: 'Acetaminophen',
        category: 'Pain Relief',
        form: 'Tablet',
        strength: '500mg',
        unitPrice: 6.0,
        requiresPrescription: false,
        minStockThreshold: 50,
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
        description: 'Analgesic and antipyretic medication used for mild to moderate pain relief and fever.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Ibuprofen 400mg (Advil)',
        genericName: 'Ibuprofen',
        category: 'Pain Relief',
        form: 'Tablet',
        strength: '400mg',
        unitPrice: 8.75,
        requiresPrescription: false,
        minStockThreshold: 40,
        imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400',
        description: 'Non-steroidal anti-inflammatory drug (NSAID) for pain, swelling, and inflammation.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Lipitor 20mg',
        genericName: 'Atorvastatin Calcium',
        category: 'Cardiovascular',
        form: 'Tablet',
        strength: '20mg',
        unitPrice: 34.0,
        requiresPrescription: true,
        minStockThreshold: 20,
        imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
        description: 'Statin medication used to lower bad cholesterol (LDL) and triglycerides.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Ventolin HFA Inhaler',
        genericName: 'Albuterol Sulfate',
        category: 'Respiratory',
        form: 'Inhaler',
        strength: '90mcg/actuation',
        unitPrice: 42.5,
        requiresPrescription: true,
        minStockThreshold: 15,
        imageUrl: 'https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=400',
        description: 'Bronchodilator providing fast relief for asthma symptoms and bronchospasms.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Vitamin C 1000mg + Zinc',
        genericName: 'Ascorbic Acid & Zinc',
        category: 'Vitamins',
        form: 'Effervescent Tablet',
        strength: '1000mg',
        unitPrice: 12.0,
        requiresPrescription: false,
        minStockThreshold: 25,
        imageUrl: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400',
        description: 'Immune support supplement formulated for rapid absorption.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    const productResult = await db.collection('products').insertMany(products);
    console.log(` Created ${productResult.insertedCount} medication items.`);

    // 6. Seed Staggered Inventory Batches (Demonstrating FEFO Logic)
    console.log('Seeding FEFO-staggered Batches...');
    const productIds = Object.values(productResult.insertedIds);

    const getFutureDate = (months: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() + months);
      return d;
    };

    const batches = [
      // Amoxicillin Batch 1: Expiring in 2 months (FEFO First Priority)
      {
        productId: productIds[0],
        batchNumber: 'AMX-2025-01',
        quantity: 25,
        costPrice: 9.0,
        expiryDate: getFutureDate(2),
        shelfLocation: 'Aisle 1, Shelf A, Bin 04',
        status: 'ACTIVE',
        createdAt: now,
      },
      // Amoxicillin Batch 2: Expiring in 18 months (FEFO Second Priority)
      {
        productId: productIds[0],
        batchNumber: 'AMX-2025-02',
        quantity: 100,
        costPrice: 9.0,
        expiryDate: getFutureDate(18),
        shelfLocation: 'Aisle 1, Shelf A, Bin 05',
        status: 'ACTIVE',
        createdAt: now,
      },
      // Paracetamol
      {
        productId: productIds[1],
        batchNumber: 'PAN-2025-A',
        quantity: 150,
        costPrice: 2.5,
        expiryDate: getFutureDate(24),
        shelfLocation: 'Aisle 2, Shelf B, Bin 12',
        status: 'ACTIVE',
        createdAt: now,
      },
      // Ibuprofen
      {
        productId: productIds[2],
        batchNumber: 'IBU-2025-88',
        quantity: 80,
        costPrice: 4.0,
        expiryDate: getFutureDate(14),
        shelfLocation: 'Aisle 2, Shelf C, Bin 03',
        status: 'ACTIVE',
        createdAt: now,
      },
      // Lipitor
      {
        productId: productIds[3],
        batchNumber: 'LIP-2025-09',
        quantity: 40,
        costPrice: 18.0,
        expiryDate: getFutureDate(10),
        shelfLocation: 'Aisle 3, Shelf A, Bin 01',
        status: 'ACTIVE',
        createdAt: now,
      },
      // Ventolin Inhaler
      {
        productId: productIds[4],
        batchNumber: 'VEN-2025-03',
        quantity: 30,
        costPrice: 22.0,
        expiryDate: getFutureDate(16),
        shelfLocation: 'Aisle 4, Shelf D, Bin 08',
        status: 'ACTIVE',
        createdAt: now,
      },
      // Vitamin C
      {
        productId: productIds[5],
        batchNumber: 'VIT-2025-55',
        quantity: 60,
        costPrice: 5.5,
        expiryDate: getFutureDate(20),
        shelfLocation: 'Aisle 5, Shelf A, Bin 10',
        status: 'ACTIVE',
        createdAt: now,
      },
    ];
    const batchResult = await db.collection('inventorybatches').insertMany(batches);
    console.log(` Created ${batchResult.insertedCount} FEFO inventory batches.\n`);

    // 7. Seed Sales Data (For Analytics/Reports)
    console.log('Seeding Sales Data...');
    const sales = [];
    const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'REFUNDED'];
    const paymentMethods = ['CASH', 'CREDIT_CARD', 'MOBILE_MONEY'];
    
    for (let i = 0; i < 35; i++) {
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30)); // random date in last 30 days
      const isCard = Math.random() > 0.5;
      const subtotal = Math.floor(Math.random() * 200) + 20;
      const tax = subtotal * 0.05;
      
      sales.push({
        invoiceNumber: `INV-${10000 + i}`,
        items: [
          {
            product: productIds[0],
            batchId: Object.values(batchResult.insertedIds)[0],
            productName: 'Amoxicillin 500mg',
            quantity: 2,
            unitPrice: 18.5,
            discount: 0,
            lineTotal: 37,
            requiresPrescription: true
          }
        ],
        subtotal: subtotal,
        taxRate: 5,
        taxAmount: tax,
        discountTotal: 0,
        totalAmount: subtotal + tax,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        amountPaid: subtotal + tax,
        changeGiven: 0,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        dispensedBy: Object.values(userResult.insertedIds)[1], // Pharmacist
        createdAt: saleDate,
        updatedAt: saleDate,
      });
    }
    const saleResult = await db.collection('sales').insertMany(sales);
    console.log(` Created ${saleResult.insertedCount} sales transactions.\n`);

    // 8. Seed Audit Logs
    console.log('Seeding Audit Logs...');
    const auditLogs = [
      {
        actorId: Object.values(userResult.insertedIds)[0],
        actorName: 'Dr. Sarah Jenkins',
        actorRole: 'ADMIN',
        action: 'UPDATE',
        targetEntity: 'Product: Amoxicillin 500mg',
        details: { field: 'price', old: 17.5, new: 18.5 },
        ipAddress: '192.168.1.45',
        timestamp: getFutureDate(-0.5) // half month ago
      },
      {
        actorId: Object.values(userResult.insertedIds)[1],
        actorName: 'Marcus Vance, PharmD',
        actorRole: 'PHARMACIST',
        action: 'DISPENSE',
        targetEntity: 'Sale: INV-10005',
        details: { items: 2, amount: 45.5 },
        ipAddress: '192.168.1.50',
        timestamp: getFutureDate(-0.2)
      },
      {
        actorId: Object.values(userResult.insertedIds)[0],
        actorName: 'Dr. Sarah Jenkins',
        actorRole: 'ADMIN',
        action: 'USER_CREATED',
        targetEntity: 'User: Elena Gomez',
        details: { role: 'CASHIER' },
        ipAddress: '192.168.1.45',
        timestamp: getFutureDate(-1)
      }
    ];
    const auditResult = await db.collection('auditlogs').insertMany(auditLogs);
    console.log(` Created ${auditResult.insertedCount} audit log entries.\n`);

    console.log('──────────────────────────────────────────────────────────');
    console.log('✅ Database Seeding Completed Successfully!');
    console.log('──────────────────────────────────────────────────────────');
    console.log('Demo Credentials for All Roles (Password: Grace@12345):');
    console.log(' • ADMIN:       admin@gracepharmacy.com');
    console.log(' • PHARMACIST:  pharmacist@gracepharmacy.com');
    console.log(' • TECHNICIAN:  technician@gracepharmacy.com');
    console.log(' • CASHIER:     cashier@gracepharmacy.com');
    console.log(' • CUSTOMER:    customer@example.com');
    console.log('──────────────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
}

seed();
