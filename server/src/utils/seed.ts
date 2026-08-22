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
      'customers',
      'messages'
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
      // ── Prescription-Only Medications ──────────────────────────────────
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
        isActive: true,
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
        isActive: true,
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
        isActive: true,
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
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },

      // ── Pain Relief & Fever (OTC) ──────────────────────────────────────
      {
        name: 'Panadol Extra 500mg',
        genericName: 'Paracetamol & Caffeine',
        category: 'Pain Relief',
        form: 'Tablet',
        strength: '500mg/65mg',
        unitPrice: 5.50,
        costPrice: 2.10,
        requiresPrescription: false,
        minStockThreshold: 40,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        description: 'Fast-acting relief for headaches, back pain, and fever with caffeine boost.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Advil Liqui-Gels 400mg',
        genericName: 'Ibuprofen Solubilized',
        category: 'Pain Relief',
        form: 'Softgel',
        strength: '400mg',
        unitPrice: 8.95,
        costPrice: 3.80,
        requiresPrescription: false,
        minStockThreshold: 35,
        imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400',
        description: 'Liquid-filled capsules for rapid absorption and long-lasting pain relief.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Aspirin 81mg Low Dose',
        genericName: 'Acetylsalicylic Acid',
        category: 'Pain Relief',
        form: 'Enteric Coated Tablet',
        strength: '81mg',
        unitPrice: 6.25,
        costPrice: 2.50,
        requiresPrescription: false,
        minStockThreshold: 30,
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
        description: 'Enteric-coated low-dose daily aspirin for cardiovascular health and pain.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },

      // ── Cold, Cough & Flu (OTC) ────────────────────────────────────────
      {
        name: 'DayQuil & NyQuil Severe Pack',
        genericName: 'Acetaminophen, Dextromethorphan, Phenylephrine',
        category: 'Cold & Flu',
        form: 'Liquid Cap',
        strength: 'Combo Pack (24ct)',
        unitPrice: 14.50,
        costPrice: 6.80,
        requiresPrescription: false,
        minStockThreshold: 25,
        imageUrl: 'https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=400',
        description: 'Non-drowsy daytime relief and soothing nighttime relief for multi-symptom cold and flu.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Strepsils Honey & Lemon Lozenges',
        genericName: 'Dichlorobenzyl alcohol & Amylmetacresol',
        category: 'Cold & Flu',
        form: 'Lozenge',
        strength: '24 Pack',
        unitPrice: 4.75,
        costPrice: 1.80,
        requiresPrescription: false,
        minStockThreshold: 50,
        imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400',
        description: 'Dual antibacterial action to soothe sore throats and mouth infections.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Saline Nasal Mist Spray',
        genericName: 'Sodium Chloride 0.9%',
        category: 'Cold & Flu',
        form: 'Nasal Spray',
        strength: '100ml',
        unitPrice: 7.20,
        costPrice: 2.90,
        requiresPrescription: false,
        minStockThreshold: 20,
        imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400',
        description: 'Drug-free sterile saline mist for instant dry and congested nasal relief.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },

      // ── Allergy & Sinus Relief (OTC) ───────────────────────────────────
      {
        name: 'Zyrtec 24-Hour Allergy 10mg',
        genericName: 'Cetirizine Hydrochloride',
        category: 'Allergy',
        form: 'Tablet',
        strength: '10mg',
        unitPrice: 16.80,
        costPrice: 7.50,
        requiresPrescription: false,
        minStockThreshold: 30,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        description: 'All-day prescription-strength relief from indoor and outdoor pollen and dust allergies.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Claritin Non-Drowsy 10mg',
        genericName: 'Loratadine',
        category: 'Allergy',
        form: 'Tablet',
        strength: '10mg',
        unitPrice: 15.25,
        costPrice: 6.90,
        requiresPrescription: false,
        minStockThreshold: 25,
        imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400',
        description: 'Provides 24-hour relief of runny nose, sneezing, itchy watery eyes, and itchy nose or throat.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },

      // ── Digestive Health (OTC) ─────────────────────────────────────────
      {
        name: 'Prilosec OTC 20mg',
        genericName: 'Omeprazole Magnesium',
        category: 'Digestive Health',
        form: 'Delayed-Release Capsule',
        strength: '20mg',
        unitPrice: 19.95,
        costPrice: 9.00,
        requiresPrescription: false,
        minStockThreshold: 20,
        imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
        description: '24-hour frequent heartburn protection that shuts down stomach acid pumps.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Tums Ultra Strength 1000',
        genericName: 'Calcium Carbonate',
        category: 'Digestive Health',
        form: 'Chewable Tablet',
        strength: '1000mg',
        unitPrice: 6.80,
        costPrice: 2.60,
        requiresPrescription: false,
        minStockThreshold: 40,
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
        description: 'Fast-acting chewable antacid for immediate acid indigestion and upset stomach relief.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Hydration Electrolyte Powder Packets',
        genericName: 'Oral Rehydration Salts',
        category: 'Digestive Health',
        form: 'Powder Sachet (16 Pack)',
        strength: 'Multi-flavor',
        unitPrice: 11.50,
        costPrice: 4.50,
        requiresPrescription: false,
        minStockThreshold: 30,
        imageUrl: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400',
        description: 'Cellular hydration multiplier designed for rapid rehydration and recovery.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },

      // ── Vitamins & Supplements (OTC) ───────────────────────────────────
      {
        name: 'Vitamin C 1000mg + Zinc & Elderberry',
        genericName: 'Ascorbic Acid & Zinc',
        category: 'Vitamins',
        form: 'Effervescent Tablet',
        strength: '1000mg',
        unitPrice: 12.00,
        costPrice: 4.80,
        requiresPrescription: false,
        minStockThreshold: 35,
        imageUrl: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400',
        description: 'Triple-action immune defense effervescent drink tablets with high bio-availability.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Vitamin D3 5000 IU High Potency',
        genericName: 'Cholecalciferol',
        category: 'Vitamins',
        form: 'Softgel',
        strength: '5000 IU',
        unitPrice: 10.50,
        costPrice: 4.00,
        requiresPrescription: false,
        minStockThreshold: 30,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        description: 'Essential sunshine vitamin for bone density, calcium absorption, and mood support.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Omega-3 Fish Oil 1200mg',
        genericName: 'EPA / DHA Fatty Acids',
        category: 'Vitamins',
        form: 'Softgel',
        strength: '1200mg (360mg Active Omega-3)',
        unitPrice: 18.00,
        costPrice: 7.20,
        requiresPrescription: false,
        minStockThreshold: 25,
        imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400',
        description: 'Purified wild fish oil softgels supporting heart, brain, and joint mobility.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },

      // ── First Aid & Medical Devices (OTC) ──────────────────────────────
      {
        name: 'Fast-Read Digital Oral Thermometer',
        genericName: 'Medical Thermometer',
        category: 'First Aid',
        form: 'Medical Device',
        strength: '10-Second Read',
        unitPrice: 12.99,
        costPrice: 5.00,
        requiresPrescription: false,
        minStockThreshold: 20,
        imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400',
        description: 'Clinical grade waterproof fever thermometer with beeper and memory recall.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Band-Aid Flexible Fabric Bandages',
        genericName: 'Sterile Adhesive Strips',
        category: 'First Aid',
        form: 'Box of 100',
        strength: 'Assorted Sizes',
        unitPrice: 7.50,
        costPrice: 2.80,
        requiresPrescription: false,
        minStockThreshold: 45,
        imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400',
        description: 'Memory-weave fabric stretches with movement for minor cuts, scrapes, and burns.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
      {
        name: 'Hydrocortisone 1% Max Anti-Itch Cream',
        genericName: 'Hydrocortisone 1%',
        category: 'First Aid',
        form: 'Topical Cream',
        strength: '2oz Tube',
        unitPrice: 6.95,
        costPrice: 2.50,
        requiresPrescription: false,
        minStockThreshold: 30,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        description: 'Maximum strength soothing relief for eczema, insect bites, poison ivy, and rashes.',
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: now,
      },
    ];
    const productResult = await db.collection('products').insertMany(products);
    const productIds = Object.values(productResult.insertedIds);
    console.log(` Created ${productResult.insertedCount} products.`);

    // 4. Seed FEFO Inventory Batches (one generous batch per product + FEFO test batches)
    console.log('Seeding FEFO Inventory Batches...');
    const batchPrefixes = [
      'AMX', 'LIP', 'VEN', 'MTX',
      'PAN', 'ADV', 'ASP',
      'DQN', 'STP', 'SAL',
      'ZYR', 'CLR',
      'PRI', 'TUM', 'HYD',
      'VTC', 'VTD', 'OMG',
      'THR', 'BND', 'HCC',
    ];
    const batches: any[] = products.map((p, i) => ({
      productId: productIds[i],
      batchNumber: `${batchPrefixes[i] || 'GEN'}-2026-${(i + 1).toString().padStart(3, '0')}`,
      quantity: 50 + Math.floor(Math.random() * 101), // 50–150 units
      costPrice: p.costPrice,
      expiryDate: daysFuture(200 + Math.floor(Math.random() * 400)), // 200–600 days out
      shelfLocation: `Aisle ${(i % 5) + 1}, Shelf ${String.fromCharCode(65 + (i % 4))}, Bin ${(i + 1).toString().padStart(2, '0')}`,
      status: 'ACTIVE',
      createdAt: daysAgo(Math.floor(Math.random() * 30) + 1),
    }));
    // Add two near-expiry FEFO test batches for pharmacist alerts
    batches.push(
      {
        productId: productIds[0], // Amoxicillin near-expiry
        batchNumber: 'AMX-2026-EXP-SOON',
        quantity: 15,
        costPrice: 8.5,
        expiryDate: daysFuture(25),
        shelfLocation: 'Aisle 1, Shelf A, Bin 04',
        status: 'ACTIVE',
        createdAt: daysAgo(30),
      },
      {
        productId: productIds[5], // Advil warning batch
        batchNumber: 'ADV-2026-WARN',
        quantity: 20,
        costPrice: 3.80,
        expiryDate: daysFuture(50),
        shelfLocation: 'Aisle 2, Shelf C, Bin 03',
        status: 'ACTIVE',
        createdAt: daysAgo(20),
      },
    );
    await db.collection('inventorybatches').insertMany(batches);
    console.log(` Created ${batches.length} FEFO-staggered inventory batches.`);

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
          { product: { _id: productIds[3], name: 'Methotrexate 2.5mg' }, name: 'Methotrexate 2.5mg', dosage: '2.5mg', frequency: 'Once weekly', duration: '30 days', quantity: 10 },
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
          { product: { _id: productIds[2], name: 'Ventolin HFA Inhaler' }, name: 'Ventolin HFA Inhaler', dosage: '90mcg', frequency: '2 puffs every 4-6 hours', duration: '30 days', quantity: 1 },
          { product: { _id: productIds[4], name: 'Panadol Extra 500mg' }, name: 'Panadol Extra 500mg', dosage: '500mg', frequency: 'Every 6 hours PRN', duration: '5 days', quantity: 20 },
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
          { product: { _id: productIds[1], name: 'Lipitor 20mg' }, name: 'Lipitor 20mg', dosage: '20mg', frequency: 'Once daily at bedtime', duration: '90 days', quantity: 90 },
        ],
        prescriptionDate: daysAgo(4),
        status: 'PREPARED',
        refillsRemaining: 2,
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
          { product: productIds[4], productName: 'Panadol Extra 500mg', quantity: 2, unitPrice: 5.50, lineTotal: 11.0 },
          { product: productIds[15], productName: 'Vitamin C 1000mg + Zinc & Elderberry', quantity: 1, unitPrice: 12.0, lineTotal: 12.0 },
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
          { product: productIds[5], productName: 'Advil Liqui-Gels 400mg', quantity: 2, unitPrice: 8.95, lineTotal: 17.90 },
          { product: productIds[2], productName: 'Ventolin HFA Inhaler', quantity: 1, unitPrice: 42.5, lineTotal: 42.5 },
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
          { product: productIds[1], productName: 'Lipitor 20mg', quantity: 1, unitPrice: 34.0, lineTotal: 34.0 },
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
    
    // Seed genuine Customer Orders
    const orders = [
      {
        tenantId: userIds[0], // fallback
        branchId: userIds[0], // fallback
        customerId: userIds[4], // John Doe
        items: [
          { medicationId: productIds[4], quantity: 1, priceAtPurchase: 5.50 },
          { medicationId: productIds[2], quantity: 1, priceAtPurchase: 42.5 }
        ],
        totalAmount: 48.5,
        status: 'PREPARED',
        fulfillmentType: 'PICKUP',
        paymentMethod: 'CASH',
        paymentStatus: 'UNPAID',
        prescriptionRequired: true,
        approvedByPharmacist: true,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1)
      },
      {
        tenantId: userIds[0],
        branchId: userIds[0],
        customerId: userIds[4],
        items: [
          { medicationId: productIds[5], quantity: 2, priceAtPurchase: 8.95 }
        ],
        totalAmount: 17.5,
        status: 'COMPLETED',
        fulfillmentType: 'DELIVERY',
        shippingAddress: {
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          zip: '12345'
        },
        paymentMethod: 'CREDIT_CARD',
        paymentStatus: 'PAID',
        prescriptionRequired: false,
        approvedByPharmacist: true,
        createdAt: daysAgo(10),
        updatedAt: daysAgo(9)
      }
    ];
    await db.collection('orders').insertMany(orders);
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

    // 8. Seed Messages
    console.log('Seeding Mock Messages...');
    const messages = [
      // Admin (Dr. Sarah Jenkins - userIds[0]) <-> Pharmacist (Marcus Vance - userIds[1])
      {
        conversationId: [userIds[0].toString(), userIds[1].toString()].sort().join('_'),
        senderId: userIds[0],
        senderName: 'Dr. Sarah Jenkins',
        senderRole: 'ADMIN',
        receiverId: userIds[1],
        receiverName: 'Marcus Vance, PharmD',
        receiverRole: 'PHARMACIST',
        message: 'Marcus, please prioritize reviewing incoming Amoxicillin prescriptions today.',
        isRead: true,
        createdAt: daysAgo(1),
      },
      {
        conversationId: [userIds[0].toString(), userIds[1].toString()].sort().join('_'),
        senderId: userIds[1],
        senderName: 'Marcus Vance, PharmD',
        senderRole: 'PHARMACIST',
        receiverId: userIds[0],
        receiverName: 'Dr. Sarah Jenkins',
        receiverRole: 'ADMIN',
        message: 'Understood Dr. Sarah, on it now.',
        isRead: false,
        createdAt: daysAgo(1),
      },
      // Pharmacist (Marcus Vance - userIds[1]) <-> Technician (David Chen - userIds[2])
      {
        conversationId: [userIds[1].toString(), userIds[2].toString()].sort().join('_'),
        senderId: userIds[1],
        senderName: 'Marcus Vance, PharmD',
        senderRole: 'PHARMACIST',
        receiverId: userIds[2],
        receiverName: 'David Chen (Lead Tech)',
        receiverRole: 'TECHNICIAN',
        message: 'David, Jane Smith\'s Ventolin prescription is approved. Please prepare it from Aisle 4, Shelf D.',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        conversationId: [userIds[1].toString(), userIds[2].toString()].sort().join('_'),
        senderId: userIds[2],
        senderName: 'David Chen (Lead Tech)',
        senderRole: 'TECHNICIAN',
        receiverId: userIds[1],
        receiverName: 'Marcus Vance, PharmD',
        receiverRole: 'PHARMACIST',
        message: 'Got it! Packaging it now.',
        isRead: true,
        createdAt: new Date(Date.now() - 3500000), 
      },
      // Technician (David Chen - userIds[2]) <-> Cashier (Elena Gomez - userIds[3])
      {
        conversationId: [userIds[2].toString(), userIds[3].toString()].sort().join('_'),
        senderId: userIds[2],
        senderName: 'David Chen (Lead Tech)',
        senderRole: 'TECHNICIAN',
        receiverId: userIds[3],
        receiverName: 'Elena Gomez (Senior Cashier)',
        receiverRole: 'CASHIER',
        message: 'Elena, Order #REC-2026-1002 is packed and placed on the front pickup shelf.',
        isRead: true,
        createdAt: new Date(Date.now() - 1800000),
      },
      {
        conversationId: [userIds[2].toString(), userIds[3].toString()].sort().join('_'),
        senderId: userIds[3],
        senderName: 'Elena Gomez (Senior Cashier)',
        senderRole: 'CASHIER',
        receiverId: userIds[2],
        receiverName: 'David Chen (Lead Tech)',
        receiverRole: 'TECHNICIAN',
        message: 'Thanks David, I see the customer walking in now.',
        isRead: false,
        createdAt: new Date(Date.now() - 1700000),
      },
      // Customer (John Doe - userIds[4]) <-> Pharmacist (Marcus Vance - userIds[1])
      {
        conversationId: [userIds[4].toString(), userIds[1].toString()].sort().join('_'),
        senderId: userIds[4],
        senderName: 'John Doe (Patient)',
        senderRole: 'CUSTOMER',
        receiverId: userIds[1],
        receiverName: 'Marcus Vance, PharmD',
        receiverRole: 'PHARMACIST',
        message: 'Hello, should I take the Amoxicillin with or without food?',
        isRead: true,
        createdAt: new Date(Date.now() - 600000),
      },
      {
        conversationId: [userIds[4].toString(), userIds[1].toString()].sort().join('_'),
        senderId: userIds[1],
        senderName: 'Marcus Vance, PharmD',
        senderRole: 'PHARMACIST',
        receiverId: userIds[4],
        receiverName: 'John Doe (Patient)',
        receiverRole: 'CUSTOMER',
        message: 'Hello John, take it with a meal and a full glass of water to avoid stomach upset.',
        isRead: false,
        createdAt: new Date(Date.now() - 300000),
      }
    ];
    await db.collection('messages').insertMany(messages);
    console.log(' Created mock messages.');

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
