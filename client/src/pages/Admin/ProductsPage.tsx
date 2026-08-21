import React, { useState, useEffect } from 'react';
import { Pill, Plus, Search, Loader2, Package } from 'lucide-react';
import api from '../../services/api';

// Interface definitions based on backend models
export interface Product {
  _id: string;
  name: string;
  genericName: string;
  sku: string;
  category: string;
  dosageForm?: string;
  strength?: string;
  unitPrice: number;
  requiresPrescription: boolean;
  reorderLevel: number;
  totalAvailableStock?: number;
  imageUrl?: string;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddProductModalOpen, setAddProductModalOpen] = useState(false);
  const [isAddBatchModalOpen, setAddBatchModalOpen] = useState(false);
  const [isEditProductModalOpen, setEditProductModalOpen] = useState(false);
  const [isDeleteProductModalOpen, setDeleteProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Forms state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Product Form
  const [newProduct, setNewProduct] = useState({
    name: '',
    genericName: '',
    category: 'OTC',
    dosageForm: '',
    strength: '',
    unitPrice: 0,
    requiresPrescription: false,
    reorderLevel: 10,
    imageUrl: '',
    hasInitialBatch: false,
    initialBatch: {
      batchNumber: '',
      quantity: 100,
      expiryDate: '',
      costPrice: 0,
      shelfLocation: { aisle: '', shelf: '' }
    }
  });

  // New Batch Form
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    quantity: 100,
    expiryDate: '',
    purchasePrice: 0,
    sellingPrice: 0
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products?all=true');
      setProducts(res.data.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        name: newProduct.name,
        genericName: newProduct.genericName,
        category: newProduct.category,
        dosageForm: newProduct.dosageForm,
        strength: newProduct.strength,
        unitPrice: newProduct.unitPrice,
        requiresPrescription: newProduct.requiresPrescription,
        reorderLevel: newProduct.reorderLevel,
        imageUrl: newProduct.imageUrl,
        ...(newProduct.hasInitialBatch ? { initialBatch: newProduct.initialBatch } : {})
      };
      
      await api.post('/products', payload);
      setAddProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Failed to add product', err);
      alert('Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setIsSubmitting(true);
      await api.put(`/products/${editingProduct._id}`, editingProduct);
      setEditProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Failed to edit product', err);
      alert('Failed to edit product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/products/${editingProduct._id}`);
      setDeleteProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product', err);
      alert('Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      setIsSubmitting(true);
      const payload = {
        productId: selectedProduct._id,
        batchNumber: newBatch.batchNumber,
        quantity: newBatch.quantity,
        expiryDate: newBatch.expiryDate,
        purchasePrice: newBatch.purchasePrice,
        sellingPrice: selectedProduct.unitPrice
      };
      await api.post('/inventory/batches', payload);
      setAddBatchModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Failed to add batch', err);
      alert('Failed to add batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Pill className="h-6 w-6 text-blue-500" />
            Medication Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your drug catalog, pricing, and stock levels.
          </p>
        </div>
        <button 
          onClick={() => setAddProductModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Medication
        </button>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Medication</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Form / Strength</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
                    Loading catalog...
                  </td>
                </tr>
              ) : filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-slate-800" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                          <Pill className="h-5 w-5 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {product.name}
                          {product.requiresPrescription && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">Rx</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400">{product.genericName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-white/[0.05]">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {product.dosageForm} • {product.strength}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                    ${product.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${(product.totalAvailableStock || 0) <= product.reorderLevel ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {(product.totalAvailableStock || 0).toLocaleString()} units
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => {
                        setSelectedProduct(product);
                        setAddBatchModalOpen(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 mr-4 transition-colors"
                    >
                      Add Batch
                    </button>
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setEditProductModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-white mr-4 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setDeleteProductModalOpen(true);
                      }}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Medication Modal ─────────────────────────────────────────── */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 my-8 relative">
            <h2 className="text-xl font-bold text-white mb-6">Add New Medication</h2>
            <form onSubmit={handleAddProduct} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Brand Name *</label>
                  <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Generic Name *</label>
                  <input required type="text" value={newProduct.genericName} onChange={e => setNewProduct({...newProduct, genericName: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category *</label>
                  <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 [color-scheme:dark]">
                    <option value="OTC">OTC</option>
                    <option value="PRESCRIPTION">Prescription</option>
                    <option value="CONTROLLED">Controlled</option>
                    <option value="SUPPLEMENT">Supplement</option>
                    <option value="MEDICAL_DEVICE">Medical Device</option>
                    <option value="COSMETIC">Cosmetic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Unit Price ($) *</label>
                  <input required type="number" min="0" step="0.01" value={newProduct.unitPrice} onChange={e => setNewProduct({...newProduct, unitPrice: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Dosage Form</label>
                  <input type="text" placeholder="e.g. Tablet, Syrup" value={newProduct.dosageForm} onChange={e => setNewProduct({...newProduct, dosageForm: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Strength</label>
                  <input type="text" placeholder="e.g. 500mg" value={newProduct.strength} onChange={e => setNewProduct({...newProduct, strength: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <input type="checkbox" id="rx" checked={newProduct.requiresPrescription} onChange={e => setNewProduct({...newProduct, requiresPrescription: e.target.checked})} className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500" />
                <label htmlFor="rx" className="text-sm text-slate-300 font-medium">Requires Prescription (Rx)</label>
              </div>

              {/* Initial Batch Section */}
              <div className="border-t border-slate-800 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    Initial Inventory Batch
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newProduct.hasInitialBatch} onChange={e => setNewProduct({...newProduct, hasInitialBatch: e.target.checked})} className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700" />
                    <span className="text-sm text-slate-400">Include stock now</span>
                  </label>
                </div>
                
                {newProduct.hasInitialBatch && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Batch Number *</label>
                      <input required type="text" value={newProduct.initialBatch.batchNumber} onChange={e => setNewProduct({...newProduct, initialBatch: {...newProduct.initialBatch, batchNumber: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Expiry Date *</label>
                      <input required type="date" value={newProduct.initialBatch.expiryDate} onChange={e => setNewProduct({...newProduct, initialBatch: {...newProduct.initialBatch, expiryDate: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Quantity *</label>
                      <input required type="number" min="1" value={newProduct.initialBatch.quantity} onChange={e => setNewProduct({...newProduct, initialBatch: {...newProduct.initialBatch, quantity: Number(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Cost Price ($) *</label>
                      <input required type="number" min="0" step="0.01" value={newProduct.initialBatch.costPrice} onChange={e => setNewProduct({...newProduct, initialBatch: {...newProduct.initialBatch, costPrice: Number(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500" />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button type="button" onClick={() => setAddProductModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all">
                  {isSubmitting ? 'Saving...' : 'Save Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Batch to Existing Medication Modal ──────────────────────── */}
      {isAddBatchModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Add Stock Batch</h2>
              <p className="text-sm text-slate-400 mt-1">For {selectedProduct.name} {selectedProduct.strength}</p>
            </div>
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Batch Number *</label>
                <input required type="text" value={newBatch.batchNumber} onChange={e => setNewBatch({...newBatch, batchNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Quantity *</label>
                <input required type="number" min="1" value={newBatch.quantity} onChange={e => setNewBatch({...newBatch, quantity: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Expiry Date *</label>
                <input required type="date" value={newBatch.expiryDate} onChange={e => setNewBatch({...newBatch, expiryDate: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Purchase Price (Cost) *</label>
                <input required type="number" min="0" step="0.01" value={newBatch.purchasePrice} onChange={e => setNewBatch({...newBatch, purchasePrice: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button type="button" onClick={() => setAddBatchModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition-all">
                  {isSubmitting ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Medication Modal ─────────────────────────────────────────── */}
      {isEditProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 my-8 relative">
            <h2 className="text-xl font-bold text-white mb-6">Edit Medication</h2>
            <form onSubmit={handleEditProduct} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Brand Name *</label>
                  <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Generic Name *</label>
                  <input required type="text" value={editingProduct.genericName} onChange={e => setEditingProduct({...editingProduct, genericName: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category *</label>
                  <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 [color-scheme:dark]">
                    <option value="OTC">OTC</option>
                    <option value="PRESCRIPTION">Prescription</option>
                    <option value="CONTROLLED">Controlled</option>
                    <option value="SUPPLEMENT">Supplement</option>
                    <option value="MEDICAL_DEVICE">Medical Device</option>
                    <option value="COSMETIC">Cosmetic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Unit Price ($) *</label>
                  <input required type="number" min="0" step="0.01" value={editingProduct.unitPrice} onChange={e => setEditingProduct({...editingProduct, unitPrice: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Dosage Form</label>
                  <input type="text" placeholder="e.g. Tablet, Syrup" value={editingProduct.dosageForm} onChange={e => setEditingProduct({...editingProduct, dosageForm: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Strength</label>
                  <input type="text" placeholder="e.g. 500mg" value={editingProduct.strength} onChange={e => setEditingProduct({...editingProduct, strength: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <input type="checkbox" id="edit-rx" checked={editingProduct.requiresPrescription} onChange={e => setEditingProduct({...editingProduct, requiresPrescription: e.target.checked})} className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500" />
                <label htmlFor="edit-rx" className="text-sm text-slate-300 font-medium">Requires Prescription (Rx)</label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditProductModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition-all">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Product Modal ─────────────────────────────────────────── */}
      {isDeleteProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-white mb-2">Delete Medication</h2>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to delete {editingProduct.name}? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteProductModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteProduct} disabled={isSubmitting} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition-all">
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
