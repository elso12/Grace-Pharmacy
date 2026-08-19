import React, { useEffect, useState } from 'react';
import { Search, MapPin, Save, Edit2 } from 'lucide-react';
import api from '../../services/api';

interface ShelfLocation {
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  shelfLocation?: ShelfLocation;
}

const ShelfDirectory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLocation, setEditLocation] = useState<ShelfLocation>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product._id);
    setEditLocation(product.shelfLocation || { aisle: '', rack: '', shelf: '', bin: '' });
  };

  const handleSaveLocation = async (id: string) => {
    setSavingId(id);
    try {
      await api.put(`/products/${id}/location`, { shelfLocation: editLocation });
      setProducts(products.map(p => p._id === id ? { ...p, shelfLocation: editLocation } : p));
      setEditingId(null);
    } catch (error) {
      console.error('Error saving shelf location:', error);
      alert('Failed to update shelf location.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Shelf Directory</h1>
        <p className="mt-1 text-sm text-slate-400">Manage and look up physical storage locations for products.</p>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/60 rounded-2xl border border-white/[0.06] backdrop-blur">
        <div className="p-5 border-b border-white/5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Search by product name or SKU..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div key={product._id} className="bg-slate-800/50 rounded-xl border border-white/5 p-4 flex flex-col gap-3">
                  <div>
                    <h3 className="text-white font-medium line-clamp-1" title={product.name}>{product.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-400 font-mono">{product.sku}</span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 mt-auto">
                    {editingId === product._id ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Aisle</label>
                          <input 
                            value={editLocation.aisle || ''} 
                            onChange={(e) => setEditLocation({...editLocation, aisle: e.target.value})}
                            className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Rack</label>
                          <input 
                            value={editLocation.rack || ''} 
                            onChange={(e) => setEditLocation({...editLocation, rack: e.target.value})}
                            className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Shelf</label>
                          <input 
                            value={editLocation.shelf || ''} 
                            onChange={(e) => setEditLocation({...editLocation, shelf: e.target.value})}
                            className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Bin</label>
                          <input 
                            value={editLocation.bin || ''} 
                            onChange={(e) => setEditLocation({...editLocation, bin: e.target.value})}
                            className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-blue-500 shrink-0" />
                        <span className="text-slate-300">
                          {product.shelfLocation?.aisle || product.shelfLocation?.rack || product.shelfLocation?.shelf || product.shelfLocation?.bin ? (
                            <>
                              {product.shelfLocation.aisle ? `Aisle ${product.shelfLocation.aisle} ` : ''}
                              {product.shelfLocation.rack ? `Rack ${product.shelfLocation.rack} ` : ''}
                              {product.shelfLocation.shelf ? `Shelf ${product.shelfLocation.shelf} ` : ''}
                              {product.shelfLocation.bin ? `Bin ${product.shelfLocation.bin}` : ''}
                            </>
                          ) : (
                            <span className="text-slate-500 italic">No location assigned</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    {editingId === product._id ? (
                      <button
                        onClick={() => handleSaveLocation(product._id)}
                        disabled={savingId === product._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors"
                      >
                        <Save size={14} />
                        {savingId === product._id ? 'Saving...' : 'Save Location'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditClick(product)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors border border-white/5"
                      >
                        <Edit2 size={14} />
                        Edit Location
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShelfDirectory;
