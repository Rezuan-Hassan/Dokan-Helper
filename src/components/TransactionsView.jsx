import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Calendar,
  CreditCard
} from 'lucide-react';
import { formatTaka } from '../services/dokanApi';

export default function TransactionsView({ state }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const filteredList = state.transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase()) ||
                          (tx.customer && tx.customer.toLowerCase().includes(search.toLowerCase())) ||
                          (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(search.toLowerCase()));

    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesPayment = paymentFilter === 'all' || tx.paymentMethod === paymentFilter;

    return matchesSearch && matchesType && matchesPayment;
  });

  const totalSalesRecorded = state.transactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpensesRecorded = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleExportCSV = () => {
    const headers = "ID,Type,Description,Customer,PaymentMethod,Amount,Time\n";
    const rows = filteredList.map(t => 
      `"${t.id}","${t.type}","${t.description}","${t.customer || ''}","${t.paymentMethod}","${t.amount}","${t.timestamp}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dokan_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Ledger Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-3xl p-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Sales Inflow
          </div>
          <div className="text-2xl font-extrabold text-brand-700 mt-1">
            {formatTaka(totalSalesRecorded)}
          </div>
          <div className="text-[11px] text-brand-600 mt-1">
            From verified counter & digital receipts
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Expense Outflow
          </div>
          <div className="text-2xl font-extrabold text-coral-600 mt-1">
            {formatTaka(totalExpensesRecorded)}
          </div>
          <div className="text-[11px] text-coral-600 mt-1">
            Shop utilities, rent & stock purchases
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Logged Transactions
            </div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">
              {state.transactions.length} Records
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Main Table with Filters */}
      <div className="glass-panel rounded-3xl p-5 shadow-glass space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, item, or payment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['all', 'sale', 'expense', 'baki'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition ${
                    filterType === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Baki / Credit">Baki / Credit</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Details / Memo</th>
                <th className="py-2.5 px-3">Customer / Vendor</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredList.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {tx.timestamp}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tx.type === 'sale' ? 'bg-brand-100 text-brand-800' :
                      tx.type === 'expense' ? 'bg-coral-100 text-coral-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tx.type === 'sale' && 'Sale'}
                      {tx.type === 'expense' && 'Expense'}
                      {tx.type === 'baki' && 'Baki (Due)'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{tx.description}</div>
                    {tx.descriptionBn && (
                      <div className="text-[10px] text-slate-400">{tx.descriptionBn}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {tx.customer || '—'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-bold ${
                      tx.type === 'sale' ? 'text-brand-700' :
                      tx.type === 'expense' ? 'text-coral-600' : 'text-amber-700'
                    }`}>
                      {tx.type === 'expense' ? '-' : '+'}{formatTaka(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
