import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import mongoose from 'mongoose';
import Product from '../models/Product.model';
import InventoryBatch from '../models/InventoryBatch.model';
import { ProductCategory, BatchStatus } from '../types/enums';

// Zod schemas for CSV validation
const productCSVSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  genericName: z.string().min(1, 'Generic name is required'),
  category: z.nativeEnum(ProductCategory),
  form: z.string().optional(),
  strength: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Unit price must be positive'),
  requiresPrescription: z.coerce.boolean().default(false),
  minStockThreshold: z.coerce.number().min(0).default(10),
});

const batchCSVSchema = z.object({
  productName: z.string().min(1, 'Product Name is required'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid expiry date' }),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  costPrice: z.coerce.number().min(0).default(0),
  shelfLocation: z.string().optional(),
});

export const importProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isDryRun = req.query.dryRun === 'true';

    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No CSV file uploaded' });
      return;
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = {
      totalRows: records.length,
      importedCount: 0,
      failedCount: 0,
      errors: [] as any[],
      preview: [] as any[],
    };

    const validProducts = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i] as any;
      try {
        const validated = productCSVSchema.parse({
          ...record,
          requiresPrescription: record.requiresPrescription === 'true' || record.requiresPrescription === '1' || record.requiresPrescription?.toLowerCase() === 'yes',
        });

        const productData = {
          name: validated.name,
          genericName: validated.genericName,
          category: validated.category,
          dosageForm: validated.form,
          strength: validated.strength,
          unitPrice: validated.unitPrice,
          requiresPrescription: validated.requiresPrescription,
          reorderLevel: validated.minStockThreshold,
          sku: `PRD-${Date.now().toString().slice(-6)}-${i}`,
          tenantId: new mongoose.Types.ObjectId(), // Mock tenant ID for now
        };

        validProducts.push(productData);
        results.importedCount++;
        
        if (isDryRun && results.preview.length < 50) {
           results.preview.push({ status: 'valid', data: productData });
        }
      } catch (error: any) {
        results.failedCount++;
        results.errors.push({ row: i + 1, data: record, errors: error.errors || error.message });
        if (isDryRun && results.preview.length < 50) {
           results.preview.push({ status: 'invalid', data: record, errors: error.errors || error.message });
        }
      }
    }

    if (!isDryRun && validProducts.length > 0) {
      await Product.insertMany(validProducts);
    }

    res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const importBatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isDryRun = req.query.dryRun === 'true';

    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No CSV file uploaded' });
      return;
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = {
      totalRows: records.length,
      importedCount: 0,
      failedCount: 0,
      errors: [] as any[],
      preview: [] as any[],
    };

    const validBatches = [];

    // Optimize DB lookups by caching products by name (case insensitive ideally, but exact match for now)
    const productNames = [...new Set(records.map((r: any) => r.productName))];
    const products = await Product.find({ name: { $in: productNames } }).select('_id name unitPrice');
    const productMap = new Map();
    products.forEach(p => productMap.set(p.name.toLowerCase(), p));

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const validated = batchCSVSchema.parse(record);
        
        const matchedProduct = productMap.get(validated.productName.toLowerCase());
        if (!matchedProduct) {
          throw new Error(`Product not found: ${validated.productName}`);
        }

        let shelfObj;
        if (validated.shelfLocation) {
          const parts = validated.shelfLocation.split('-');
          shelfObj = {
            aisle: parts[0] || '',
            rack: parts[1] || '',
            shelf: parts[2] || '',
          };
        }

        const batchData = {
          product: matchedProduct._id,
          batchNumber: validated.batchNumber,
          quantity: validated.quantity,
          initialQuantity: validated.quantity,
          expiryDate: new Date(validated.expiryDate),
          purchasePrice: validated.costPrice,
          sellingPrice: matchedProduct.unitPrice || 0,
          status: BatchStatus.ACTIVE,
          shelfLocation: shelfObj,
        };

        validBatches.push(batchData);
        results.importedCount++;
        
        if (isDryRun && results.preview.length < 50) {
           results.preview.push({ status: 'valid', data: { ...batchData, productName: matchedProduct.name } });
        }
      } catch (error: any) {
        results.failedCount++;
        results.errors.push({ row: i + 1, data: record, errors: error.errors || error.message });
        if (isDryRun && results.preview.length < 50) {
           results.preview.push({ status: 'invalid', data: record, errors: error.errors || error.message });
        }
      }
    }

    if (!isDryRun && validBatches.length > 0) {
      await InventoryBatch.insertMany(validBatches);
    }

    res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
