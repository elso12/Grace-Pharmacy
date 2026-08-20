import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.model';
import InventoryBatch from '../models/InventoryBatch.model';
import { BatchStatus, ProductCategory } from '../types/enums';

// ─── GET /api/products ───────────────────────────────────────────────────────
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, search, requiresPrescription, page = '1', limit = '10', all = 'false' } = req.query;
    
    // If 'all' is true, don't filter by isActive, otherwise only active
    const filter: any = all === 'true' ? {} : { isActive: true };

    if (category) filter.category = category;
    if (requiresPrescription !== undefined) filter.requiresPrescription = requiresPrescription === 'true';
    if (search && typeof search === 'string' && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Fetch products
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const totalCount = await Product.countDocuments(filter);

    const now = new Date();
    
    // Add stock level to each product
    const productsWithStock = await Promise.all(products.map(async (p) => {
      const batches = await InventoryBatch.find({
        product: p._id,
        status: BatchStatus.ACTIVE,
        expiryDate: { $gt: now },
        quantity: { $gt: 0 }
      }).lean();
      
      const totalAvailableStock = batches.reduce((sum, b) => sum + b.quantity, 0);
      
      return {
        ...p,
        totalAvailableStock
      };
    }));

    res.status(200).json({
      status: 'success',
      count: productsWithStock.length,
      totalCount,
      data: productsWithStock,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/products/:id ───────────────────────────────────────────────────
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      res.status(404).json({ status: 'error', message: 'Product not found' });
      return;
    }
    
    const now = new Date();
    const batches = await InventoryBatch.find({
      product: product._id,
      status: BatchStatus.ACTIVE,
      expiryDate: { $gt: now },
      quantity: { $gt: 0 }
    }).lean();
    
    const totalAvailableStock = batches.reduce((sum, b) => sum + b.quantity, 0);

    res.status(200).json({
      status: 'success',
      data: { ...product, totalAvailableStock },
    });
  } catch (error) {
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ status: 'error', message: `'${req.params.id}' is not a valid product ID` });
      return;
    }
    next(error);
  }
};

// ─── POST /api/products ──────────────────────────────────────────────────────
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sku = req.body.sku || `PRD-${Date.now().toString().slice(-6)}`;
    
    // In a fully multi-tenant setup, this comes from req.user.tenantId
    // For this demo, we generate a mock one if none exists in req
    const tenantId = new mongoose.Types.ObjectId(); 
    
    const productData = { ...req.body, sku, tenantId };
    
    const product = await Product.create(productData);
    
    let initialBatch = null;
    
    if (req.body.initialBatch) {
       const batchData = {
         product: product._id,
         batchNumber: req.body.initialBatch.batchNumber,
         quantity: req.body.initialBatch.quantity,
         initialQuantity: req.body.initialBatch.quantity,
         expiryDate: req.body.initialBatch.expiryDate,
         purchasePrice: req.body.initialBatch.costPrice || 0,
         sellingPrice: product.unitPrice || 0,
         shelfLocation: req.body.initialBatch.shelfLocation,
         status: BatchStatus.ACTIVE,
       };
       initialBatch = await InventoryBatch.create(batchData);
    }
    
    res.status(201).json({
      status: 'success',
      data: { product, initialBatch }
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/products/:id ───────────────────────────────────────────────────
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) {
       res.status(404).json({ status: 'error', message: 'Product not found' });
       return;
    }
    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/products/:id ────────────────────────────────────────────────
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) {
       res.status(404).json({ status: 'error', message: 'Product not found' });
       return;
    }
    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/products/:id/location ──────────────────────────────────────────
export const updateShelfLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shelfLocation } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ status: 'error', message: 'Product not found' });
      return;
    }
    product.shelfLocation = shelfLocation;
    await product.save();
    res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
