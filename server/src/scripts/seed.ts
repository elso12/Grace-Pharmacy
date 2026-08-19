/**
 * ─── Database Seeder: Storefront Products ────────────────────────────────────
 *
 * Wipes the StorefrontProduct collection and re-populates it with realistic
 * pharmacy test data.
 *
 * Usage (from the /server directory):
 *   npx ts-node src/scripts/seed.ts
 *
 * The script connects to MongoDB using the same MONGO_URI env var as the main
 * application.  Make sure your .env file is present before running.
 */

import dotenv from 'dotenv';
dotenv.config(); // Must be first — populates process.env before connectDB reads MONGO_URI

import mongoose from 'mongoose';
import connectDB from '../config/db';
import StorefrontProduct, { StorefrontCategory } from '../models/Product';

// ─── Seed Data ────────────────────────────────────────────────────────────────
const seedProducts = [
  // ── Pain Relief ────────────────────────────────────────────────────────────
  {
    name:                 'Advil Ibuprofen 200mg',
    description:          'Fast-acting NSAID pain reliever for headaches, muscle aches, menstrual cramps, and fever. Each tablet contains 200 mg of ibuprofen.',
    category:             StorefrontCategory.PainRelief,
    price:                8.99,
    requiresPrescription: false,
    manufacturer:         'Haleon',
    imageUrl:             'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  },
  {
    name:                 'Tylenol Extra Strength 500mg',
    description:          'Acetaminophen pain reliever and fever reducer. Gentle on the stomach and safe for daily use at recommended doses.',
    category:             StorefrontCategory.PainRelief,
    price:                11.49,
    requiresPrescription: false,
    manufacturer:         'Johnson & Johnson',
    imageUrl:             'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  },
  {
    name:                 'Voltaren Emulgel 1% Diclofenac',
    description:          'Topical anti-inflammatory gel for targeted relief of joint and muscle pain. Apply directly to the affected area up to 4 times daily.',
    category:             StorefrontCategory.PainRelief,
    price:                14.99,
    requiresPrescription: false,
    manufacturer:         'GlaxoSmithKline',
    imageUrl:             'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  },

  // ── Vitamins & Supplements ─────────────────────────────────────────────────
  {
    name:                 'Vitamin C 1000mg Effervescent Tablets',
    description:          'High-dose Vitamin C with orange flavour. Supports immune function, skin health, and antioxidant protection. One tablet per day dissolved in water.',
    category:             StorefrontCategory.Vitamins,
    price:                9.49,
    requiresPrescription: false,
    manufacturer:         'Bayer',
    imageUrl:             'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400',
  },
  {
    name:                 'Centrum Silver Multivitamin Adults 50+',
    description:          'Complete daily multivitamin formulated for adults 50 and older. Contains 23 essential vitamins and minerals including Vitamin D3 and B12.',
    category:             StorefrontCategory.Vitamins,
    price:                19.99,
    requiresPrescription: false,
    manufacturer:         'Haleon',
    imageUrl:             'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400',
  },
  {
    name:                 'Omega-3 Fish Oil 1000mg',
    description:          'Pharmaceutical-grade purified fish oil providing 300 mg EPA and DHA per softgel. Supports heart, brain, and joint health.',
    category:             StorefrontCategory.Vitamins,
    price:                16.75,
    requiresPrescription: false,
    manufacturer:         'Nature Made',
    imageUrl:             'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400',
  },

  // ── Allergy ────────────────────────────────────────────────────────────────
  {
    name:                 'Claritin 24-Hour Non-Drowsy Loratadine 10mg',
    description:          'Non-drowsy 24-hour relief from seasonal allergy symptoms including sneezing, runny nose, and itchy eyes. One tablet daily.',
    category:             StorefrontCategory.Allergy,
    price:                18.99,
    requiresPrescription: false,
    manufacturer:         'Bayer',
    imageUrl:             'https://images.unsplash.com/photo-1631638186815-2e77c5e279bc?w=400',
  },
  {
    name:                 'Zyrtec Cetirizine HCl 10mg',
    description:          'Prescription-strength allergy medicine available over the counter. Provides 24-hour relief from indoor and outdoor allergies.',
    category:             StorefrontCategory.Allergy,
    price:                22.49,
    requiresPrescription: false,
    manufacturer:         'Johnson & Johnson',
    imageUrl:             'https://images.unsplash.com/photo-1631638186815-2e77c5e279bc?w=400',
  },
  {
    name:                 'Flonase Sensimist Allergy Relief Nasal Spray',
    description:          'Gentle mist nasal spray with fluticasone furoate for full symptom relief including nasal congestion, sneezing, and itchy eyes.',
    category:             StorefrontCategory.Allergy,
    price:                17.29,
    requiresPrescription: false,
    manufacturer:         'Haleon',
    imageUrl:             'https://images.unsplash.com/photo-1631638186815-2e77c5e279bc?w=400',
  },

  // ── First Aid ──────────────────────────────────────────────────────────────
  {
    name:                 'Band-Aid Brand Flexible Fabric Bandages (100-Count)',
    description:          'Flexible fabric bandages that move with your body. Ideal for cuts, scrapes, and blisters. Individually wrapped for hygiene.',
    category:             StorefrontCategory.FirstAid,
    price:                7.99,
    requiresPrescription: false,
    manufacturer:         'Johnson & Johnson',
    imageUrl:             'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400',
  },
  {
    name:                 'Neosporin Original First Aid Antibiotic Ointment',
    description:          'Triple antibiotic ointment (neomycin, polymyxin B, bacitracin) to help prevent infection and promote healing of minor cuts and burns.',
    category:             StorefrontCategory.FirstAid,
    price:                9.29,
    requiresPrescription: false,
    manufacturer:         'Johnson & Johnson',
    imageUrl:             'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400',
  },
  {
    name:                 'Betadine Antiseptic Solution 250ml',
    description:          'Povidone-iodine 10% antiseptic solution for pre- and post-operative skin cleansing, wound management, and preventing infection.',
    category:             StorefrontCategory.FirstAid,
    price:                6.49,
    requiresPrescription: false,
    manufacturer:         'Purdue Pharma',
    imageUrl:             'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400',
  },

  // ── Mother & Baby ──────────────────────────────────────────────────────────
  {
    name:                 'Enfamil NeuroPro Infant Formula (29 oz)',
    description:          'MFGM (milk fat globule membrane) and DHA infant formula that supports brain development. Clinically shown to be closer to breast milk.',
    category:             StorefrontCategory.MotherBaby,
    price:                44.99,
    requiresPrescription: false,
    manufacturer:         'Mead Johnson',
    imageUrl:             'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400',
  },
  {
    name:                 'Pregnacare Max Prenatal Multivitamin',
    description:          'Comprehensive prenatal vitamin with Folic Acid 400 mcg, Iron, Omega-3 DHA, and Vitamin D3. Supports mother and baby during pregnancy.',
    category:             StorefrontCategory.MotherBaby,
    price:                27.99,
    requiresPrescription: false,
    manufacturer:         'Vitabiotics',
    imageUrl:             'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400',
  },
  {
    name:                 'Gripe Water for Newborns & Infants',
    description:          'Natural herbal supplement for relief of infant gas, colic, and stomach discomfort. Contains fennel and ginger extracts. Alcohol-free.',
    category:             StorefrontCategory.MotherBaby,
    price:                12.99,
    requiresPrescription: false,
    manufacturer:         'Mommy\'s Bliss',
    imageUrl:             'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400',
  },
];

// ─── Seed Runner ──────────────────────────────────────────────────────────────
const seed = async (): Promise<void> => {
  try {
    await connectDB();

    console.log('\n  🌱 Starting storefront product seeder...\n');

    // Wipe existing storefront products
    const deleteResult = await StorefrontProduct.deleteMany({});
    console.log(`  🗑️  Cleared ${deleteResult.deletedCount} existing storefront product(s).`);

    // Insert fresh seed data
    const inserted = await StorefrontProduct.insertMany(seedProducts);
    console.log(`  ✅ Successfully inserted ${inserted.length} storefront product(s).\n`);

    // Summary breakdown by category
    const summary = seedProducts.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {});

    console.log('  📦 Products by category:');
    Object.entries(summary).forEach(([cat, count]) => {
      console.log(`     • ${cat}: ${count}`);
    });

    console.log('\n  🎉 Seeding complete!\n');
  } catch (error) {
    console.error('\n  ❌ Seeder error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('  🔌 Database connection closed.\n');
    process.exit(0);
  }
};

seed();
