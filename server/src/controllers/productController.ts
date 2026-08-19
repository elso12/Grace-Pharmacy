import { Request, Response, NextFunction } from 'express';
import StorefrontProduct, { StorefrontCategory } from '../models/Product';

/**
 * @desc    Fetch all storefront products with optional filtering
 * @route   GET /api/products
 * @access  Public
 *
 * Supported query params:
 *   ?category=Pain Relief   — filter by exact category enum value
 *   ?search=ibuprofen        — full-text search across name, description, manufacturer
 *   ?requiresPrescription=true|false — filter by prescription requirement
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // ── Category filter ──────────────────────────────────────────────────────
    const { category, search, requiresPrescription } = req.query;

    if (category) {
      // Validate against the enum so users can't inject arbitrary values
      const validCategories = Object.values(StorefrontCategory) as string[];
      if (!validCategories.includes(category as string)) {
        res.status(400).json({
          status:  'error',
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        });
        return;
      }
      filter.category = category;
    }

    // ── Full-text search ─────────────────────────────────────────────────────
    // Uses MongoDB text index on (name, description, manufacturer)
    if (search && typeof search === 'string' && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // ── Prescription filter ──────────────────────────────────────────────────
    if (requiresPrescription !== undefined) {
      filter.requiresPrescription = requiresPrescription === 'true';
    }

    const products = await StorefrontProduct.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      status:  'success',
      count:   products.length,
      data:    products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch a single storefront product by its MongoDB ObjectId
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await StorefrontProduct.findById(req.params.id);

    if (!product) {
      res.status(404).json({
        status:  'error',
        message: `Product with id '${req.params.id}' not found`,
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data:   product,
    });
  } catch (error) {
    // Mongoose CastError fires when :id is not a valid ObjectId format
    if ((error as Error).name === 'CastError') {
      res.status(400).json({
        status:  'error',
        message: `'${req.params.id}' is not a valid product ID`,
      });
      return;
    }
    next(error);
  }
};

// ─── Update Shelf Location ──────────────────────────────────────────────────
import Product from '../models/Product.model';

export const updateShelfLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { shelfLocation } = req.body;

    const product = await Product.findById(id);
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
