import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Plus, 
  Minus, 
  RotateCw, 
  DollarSign, 
  CheckCircle,
  Filter,
  Layers
} from 'lucide-react';
import { formatTaka } from '../services/dokanApi';

export default function InventoryView({ state, onUpdateStock }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(10);

  const categories = ['All', ...new Set(state.inventory.map(i => i.category))];

  const filteredItems = state.inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.nameBn?.includes(search) ||
                          item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalInventoryValue = state.inventory.reduce(
    (sum, i) => sum + (i.stock * i.sellingPrice), 0
  );
  const lowStockCount = state.inventory.filter(i => i.stock <= i.lowStockThreshold).length;

  const handleStockSave = (e) => {
    e.preventDefault();
    if (!adjustModalItem) return;
    onUpdateStock(adjustModalItem.id, Number(adjustQty));
    setAdjustModalItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Inventory Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-3xl p-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Inventory Valuation
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatTaka(totalInventoryValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            At retail counter selling prices
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Unique SKUs
          </div>
          <div className="text-2xl font-extrabold text-brand-700 mt-1">
            {state.inventory.length} Products
          </div>
          <div className="text-[11px] text-brand-600 mt-1">
            Active grocery catalog
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Low Stock Alerts
          </div>
          <div className="text-2xl font-extrabold text-coral-600 mt-1 flex items-center gap-2">
            <span>{lowStockCount} Items</span>
            {lowStockCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-coral-500 animate-ping" />
            )}
          </div>
          <div className="text-[11px] text-coral-600 mt-1">
            Requires supplier reorder
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-3xl p-5 shadow-glass space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rice, oil, dal, eggs, sugar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs bg-white border border-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Stock Level</th>
                <th className="py-3 px-3">Cost Price</th>
                <th className="py-3 px-3">Selling Price</th>
                <th className="py-3 px-3">Total Value</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.map(item => {
                const isLow = item.stock <= item.lowStockThreshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cream-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[11px] text-slate-400">{item.nameBn} • SKU: {item.sku}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isLow ? 'text-coral-600' : 'text-slate-800'}`}>
                          {item.stock} {item.unit}
                        </span>
                        {isLow && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-coral-100 text-coral-700 px-2 py-0.5 rounded-full animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock (&lt;{item.lowStockThreshold})
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-medium">
                      {formatTaka(item.costPrice)} / {item.unit}
                    </td>

                    <td className="py-3 px-3 text-brand-700 font-bold">
                      {formatTaka(item.sellingPrice)} / {item.unit}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {formatTaka(item.stock * item.sellingPrice)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setAdjustModalItem(item);
                          setAdjustQty(item.stock);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 font-semibold text-[11px] text-slate-600 transition"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Adjust Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">
              Adjust Stock: {adjustModalItem.name}
            </h4>
            <p className="text-xs text-slate-500">
              Update physical on-hand inventory count ({adjustModalItem.unit})
            </p>

            <form onSubmit={handleStockSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  New Stock Count ({adjustModalItem.unit})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustQty(prev => Math.max(0, prev - 1))}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="w-full text-center py-2 text-lg font-bold border rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustQty(prev => prev + 5)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold"
                >
                  Save New Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
