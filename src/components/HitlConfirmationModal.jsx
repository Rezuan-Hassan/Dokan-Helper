import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  X, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Package, 
  User, 
  FileCheck,
  RotateCcw,
  PlusCircle,
  CheckCheck
} from 'lucide-react';
import { formatTaka } from '../services/dokanApi';

export default function HitlConfirmationModal({ 
  isOpen, 
  onClose, 
  parsedResult, 
  onConfirm,
  inventoryList = [],
  bakiList = []
}) {
  if (!isOpen || !parsedResult) return null;

  const [formData, setFormData] = useState({
    type: 'sale',
    title: '',
    amount: 0,
    quantity: '',
    unit: 'kg',
    customerName: '',
    matchedCustomerId: null,
    paymentMethod: 'Cash',
    matchedInventoryId: '',
    category: 'General'
  });

  useEffect(() => {
    if (parsedResult?.parsed) {
      const p = parsedResult.parsed;
      const initialType = p.type === 'baki' ? 'baki_add' : (p.type || 'sale');
      
      setFormData({
        type: initialType,
        title: p.title || '',
        amount: p.amount || 0,
        quantity: p.quantity !== null && p.quantity !== undefined ? p.quantity : '',
        unit: p.unit || (p.matchedInventoryId ? (inventoryList.find(i => i.id === p.matchedInventoryId)?.unit || 'pcs') : 'kg'),
        customerName: p.customerName || (initialType === 'expense' ? 'Operating Expense' : 'Walk-in Customer'),
        matchedCustomerId: p.matchedCustomerId || null,
        paymentMethod: initialType === 'baki_add' ? 'Baki / Credit' : 'Cash',
        matchedInventoryId: p.matchedInventoryId || '',
        category: p.category || 'General'
      });
    }
  }, [parsedResult, inventoryList]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'type') {
        if (value === 'baki_add') {
          updated.paymentMethod = 'Baki / Credit';
        } else if (value === 'baki_payment' || value === 'sale') {
          updated.paymentMethod = 'Cash';
        }
      }
      return updated;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    onConfirm({
      ...formData,
      amount: Number(formData.amount) || 0,
      quantity: formData.quantity ? Number(formData.quantity) : null
    });
  };

  const matchedItemObj = inventoryList.find(i => i.id === formData.matchedInventoryId);
  const matchedCustomerObj = bakiList.find(c => c.id === formData.matchedCustomerId || c.customerName.toLowerCase() === (formData.customerName || '').toLowerCase());

  const typeConfig = [
    { id: 'sale', label: 'Sale (বিক্রি)', icon: TrendingUp, color: 'brand' },
    { id: 'expense', label: 'Expense (খরচ)', icon: TrendingDown, color: 'coral' },
    { id: 'baki_add', label: 'Add Baki (বাকি দেওয়া)', icon: BookOpen, color: 'amber' },
    { id: 'baki_payment', label: 'Baki Paid (বাকি পরিশোধ)', icon: CheckCheck, color: 'emerald' },
    { id: 'restock', label: 'Restock (পণ্য ক্রয়)', icon: PlusCircle, color: 'blue' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm">Confirm Transaction</h3>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Review & Approve
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input prompt & match notice */}
        {parsedResult.rawPrompt && (
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 truncate flex items-center justify-between">
            <span className="truncate italic">"{parsedResult.rawPrompt}"</span>
            <span className="font-semibold text-slate-400 text-[11px] ml-2 flex-shrink-0">
              {parsedResult.source || 'Smart Match'}
            </span>
          </div>
        )}

        {/* Editable Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Action Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Action Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {typeConfig.map(tc => {
                const Icon = tc.icon;
                const isSelected = formData.type === tc.id;
                return (
                  <button
                    key={tc.id}
                    type="button"
                    onClick={() => handleChange('type', tc.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{tc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Description / Memo
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:border-brand-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Amount (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">৳</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  required
                  className="w-full pl-7 pr-3 py-2 rounded-xl text-xs font-bold text-slate-800 border border-slate-200 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Customer / Vendor
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => {
                    handleChange('customerName', e.target.value);
                    handleChange('matchedCustomerId', null);
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-slate-200 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Customer Match Indicator */}
          {matchedCustomerObj && (
            <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/70 p-2.5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Linked to existing debtor: <strong>{matchedCustomerObj.customerName}</strong>
                </span>
              </div>
              <span className="font-bold">
                Current Due: {formatTaka(matchedCustomerObj.totalDue)}
              </span>
            </div>
          )}

          {/* Inventory Link Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-brand-600" />
                Link Inventory
              </label>
              <select
                value={formData.matchedInventoryId || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const item = inventoryList.find(i => i.id === selectedId);
                  handleChange('matchedInventoryId', selectedId || null);
                  if (item) handleChange('unit', item.unit);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none"
              >
                <option value="">None (Don't alter stock)</option>
                {inventoryList.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.stock} {item.unit} in stock)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Quantity & Unit
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Qty"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none"
                />
                <select
                  value={formData.unit || 'kg'}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="kg">kg</option>
                  <option value="liters">liters</option>
                  <option value="pcs">pcs</option>
                  <option value="packs">packs</option>
                </select>
              </div>
            </div>

            {matchedItemObj && formData.quantity > 0 && (
              <div className="md:col-span-2 text-[11px] text-brand-800 bg-brand-50 border border-brand-200/60 p-2 rounded-xl flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                <span>
                  {formData.type === 'restock' ? (
                    <>Will add <strong>{formData.quantity} {formData.unit}</strong> to <strong>{matchedItemObj.name}</strong> (New: {matchedItemObj.stock + Number(formData.quantity)} {formData.unit}).</>
                  ) : (
                    <>Will deduct <strong>{formData.quantity} {formData.unit}</strong> from <strong>{matchedItemObj.name}</strong> (Remaining: {Math.max(0, matchedItemObj.stock - Number(formData.quantity))} {formData.unit}).</>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Cash', 'bKash', 'Nagad', 'Baki / Credit'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleChange('paymentMethod', method)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-xl border text-center transition ${
                    formData.paymentMethod === method
                      ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/25 flex items-center gap-1.5 transition active:scale-95"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Confirm & Save ({formatTaka(formData.amount)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
