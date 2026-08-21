/**
 * ─── Storefront Product API ────────────────────────────────────────────────
 *
 * Thin service layer for the B2C product catalog endpoints.
 * Reuses the singleton `api` Axios instance so all requests automatically
 * carry the JWT Bearer token and share the same timeout / interceptor chain.
 *
 * Endpoints consumed:
 *   GET /api/products          — list with optional query params
 *   GET /api/products/:id      — single product
 */

import api from './api';

// ── Shared type (mirrors server IStorefrontProduct) ───────────────────────────
export interface Product {
  _id:                  string;
  name:                 string;
  description?:         string;
  category:             StorefrontCategory;
  price:                number;
  requiresPrescription: boolean;
  manufacturer?:        string;
  imageUrl?:            string;
  createdAt:            string;
  updatedAt:            string;
}

export type StorefrontCategory =
  | 'Vitamins'
  | 'Pain Relief'
  | 'Allergy'
  | 'First Aid'
  | 'Mother & Baby';

export const STOREFRONT_CATEGORIES: StorefrontCategory[] = [
  'Vitamins',
  'Pain Relief',
  'Allergy',
  'First Aid',
  'Mother & Baby',
];

interface ProductListResponse {
  status: 'success' | 'error';
  count:  number;
  data:   Product[];
}

interface ProductDetailResponse {
  status: 'success' | 'error';
  data:   Product;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Fetch all storefront products with optional server-side filtering.
 *
 * @param category           Filter by exact StorefrontCategory enum value.
 * @param search             Full-text search string (matches name / description / manufacturer).
 * @param requiresPrescription  Filter by OTC vs. prescription products.
 */
export const getAllProducts = async (
  category?:             StorefrontCategory | '',
  search?:               string,
  requiresPrescription?: boolean,
): Promise<Product[]> => {
  const params: Record<string, string> = {};

  if (category)                          params.category             = category;
  if (search && search.trim())           params.search               = search.trim();
  if (requiresPrescription !== undefined) params.requiresPrescription = String(requiresPrescription);

  const { data } = await api.get<ProductListResponse>('/products', { params });
  return data.data.map((p: any) => ({ ...p, price: p.unitPrice }));
};

/**
 * Fetch a single storefront product by its MongoDB ObjectId.
 */
export const getProductById = async (id: string): Promise<Product> => {
  const { data } = await api.get<ProductDetailResponse>(`/products/${id}`);
  return { ...data.data, price: (data.data as any).unitPrice };
};
