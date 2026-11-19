import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  Phone, 
  Send, 
  UserPlus, 
  Calendar, 
  AlertCircle,
  Clock,
  MapPin,
  Search
} from 'lucide-react';
import { formatTaka } from '../services/dokanApi';

export default function BakiView({ state, onMarkPaid, onAddNewBaki, onSendSms }) {
  const [filter, setFilter] = useState('unpaid'); // 'all', 'unpaid', 'paid'
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBakiForm, setNewBakiForm] = useState({
    customerName: '',
    phone: '',
    amount: '',
    itemsNote: ''
  });

  const totalOutstanding = state.customersBaki
    .filter(c => c.status !== 'paid')
    .reduce((sum, c) => sum + (c.totalDue || 0), 0);

  const filteredCustomers = state.customersBaki.filter(c => {
    const matchesFilter = filter === 'all' 
      ? true 
      : filter === 'unpaid' 
      ? c.status !== 'paid' && c.totalDue > 0
      : c.status === 'paid' || c.totalDue === 0;

    const matchesSearch = c.customerName.toLowerCase().includes(search.toLowerCase()) ||
                          c.phone.includes(search) ||
                          (c.itemsNote && c.itemsNote.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handleCreateBaki = (e) => {
    e.preventDefault();
    if (!newBakiForm.customerName || !newBakiForm.amount) return;
    onAddNewBaki({
      type: 'baki',
      title: `Baki: ${newBakiForm.itemsNote || 'Groceries'}`,
      amount: Number(newBakiForm.amount),
      customerName: newBakiForm.customerName,
      phone: newBakiForm.phone,
      paymentMethod: 'Baki / Credit'
    });
    setNewBakiForm({ customerName: '', phone: '', amount: '', itemsNote: '' });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Baki Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-3xl p-5 border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-white">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Total Outstanding Baki (বাকি)
          </div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">
            {formatTaka(totalOutstanding)}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            Across {state.customersBaki.filter(c => c.totalDue > 0).length} customers
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Average Due per Customer
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            {formatTaka(totalOutstanding / (state.customersBaki.filter(c => c.totalDue > 0).length || 1))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Normal retail repayment cycle ~7 days
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick Action
            </div>
            <div className="text-sm font-semibold text-slate-700 mt-1">
              Add Customer Due or Send SMS
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Record New Baki Entry
          </button>
        </div>
      </div>

      {/* Filter and List Container */}
      <div className="glass-panel rounded-3xl p-5 shadow-glass space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white border border-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'unpaid' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Unpaid Dues ({state.customersBaki.filter(c => c.totalDue > 0).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              All Customers ({state.customersBaki.length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'paid' ? 'bg-white text-brand-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Cleared / Paid
            </button>
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredCustomers.map(cust => {
            const isCleared = cust.totalDue === 0 || cust.status === 'paid';
            return (
              <div
                key={cust.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCleared 
                    ? 'bg-brand-50/40 border-brand-200/80' 
                    : 'bg-white/90 border-slate-200/90 shadow-sm hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{cust.customerName}</span>
                      {isCleared ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Fully Cleared
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Due Pending
                        </span>
                      )}
                    </div>
                    {cust.customerNameBn && (
                      <div className="text-[11px] text-slate-400">{cust.customerNameBn}</div>
                    )}
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{cust.phone}</span>
                    </div>
                    {cust.address && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{cust.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-semibold">Total Due</div>
                    <div className={`text-lg font-extrabold ${isCleared ? 'text-brand-600' : 'text-amber-800'}`}>
                      {formatTaka(cust.totalDue)}
                    </div>
                  </div>
                </div>

                {/* Items note */}
                {cust.itemsNote && (
                  <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Recent Items: </span>
                    <span>{cust.itemsNote}</span>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last purchase: {cust.lastTransactionDate}
                  </span>

                  <div className="flex items-center gap-2">
                    {!isCleared && (
                      <>
                        <button
                          type="button"
                          onClick={() => onSendSms(cust)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3 text-slate-500" />
                          <span>SMS Taagada</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onMarkPaid(cust.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-bold shadow-sm shadow-brand-500/25 transition flex items-center gap-1 active:scale-95"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Mark Paid</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Baki Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Record New Customer Baki (Due)</h3>
            <p className="text-xs text-slate-500">
              Directly add a new customer or add to an existing ledger
            </p>

            <form onSubmit={handleCreateBaki} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Mia / Karim Store"
                  value={newBakiForm.customerName}
                  onChange={(e) => setNewBakiForm({ ...newBakiForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="017xx-xxxxxx"
                  value={newBakiForm.phone}
                  onChange={(e) => setNewBakiForm({ ...newBakiForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Due Amount (৳)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 500"
                  value={newBakiForm.amount}
                  onChange={(e) => setNewBakiForm({ ...newBakiForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Items / Memo Note</label>
                <input
                  type="text"
                  placeholder="e.g. Chal 5kg, Tel 1L"
                  value={newBakiForm.itemsNote}
                  onChange={(e) => setNewBakiForm({ ...newBakiForm, itemsNote: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold"
                >
                  Save Baki Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
