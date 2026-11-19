import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  BookOpen, 
  Sparkles, 
  ArrowUpRight, 
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { formatTaka, generateBusinessInsights, getLiveGeminiInsights } from '../services/dokanApi';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl text-xs space-y-1.5 min-w-[130px]">
        <div className="font-bold text-slate-700 pb-1 border-b border-slate-100 flex items-center justify-between">
          <span>{label}</span>
        </div>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 capitalize font-medium" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-slate-800">
              {formatTaka(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function DashboardView({ 
  state, 
  onNavigateTab
}) {
  const [txFilter, setTxFilter] = useState('all');
  const [chartType, setChartType] = useState('area');
  const [insights, setInsights] = useState(() => generateBusinessInsights(state));
  const [isFetchingInsights, setIsFetchingInsights] = useState(false);

  // Fetch live Gemini insights seamlessly
  useEffect(() => {
    let isMounted = true;
    setIsFetchingInsights(true);
    getLiveGeminiInsights(state).then(res => {
      if (isMounted && res && res.length > 0) {
        setInsights(res);
      }
    }).finally(() => {
      if (isMounted) setIsFetchingInsights(false);
    });

    return () => { isMounted = false; };
  }, [state]);

  const todayTrend = state.weeklyTrends[state.weeklyTrends.length - 1] || { sales: 0, expenses: 0 };
  const todaySales = todayTrend.sales || 0;
  const todayExpenses = todayTrend.expenses || 0;
  const todayNetProfit = todaySales - todayExpenses;
  const totalBaki = state.customersBaki.reduce((sum, c) => sum + (c.totalDue || 0), 0);

  const filteredTransactions = state.transactions.filter(tx => {
    if (txFilter === 'all') return true;
    return tx.type === txFilter;
  });

  return (
    <div className="space-y-6">
      {/* 4 Glass KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 border border-brand-200/80 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatTaka(todaySales)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-700 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.2% pace</span>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-coral-50 text-coral-600 border border-coral-200/80 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatTaka(todayExpenses)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Operating & Utilities
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Profit
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className={`text-2xl font-extrabold tracking-tight ${todayNetProfit >= 0 ? 'text-brand-700' : 'text-coral-600'}`}>
              {formatTaka(todayNetProfit)}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Margin ~31%
            </div>
          </div>
        </div>

        {/* Total Baki */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Baki (Dues)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-amber-900 tracking-tight">
              {formatTaka(totalBaki)}
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-700 mt-0.5">
              <span>{state.customersBaki.filter(c => c.totalDue > 0).length} customers</span>
              <button 
                onClick={() => onNavigateTab('baki')}
                className="hover:underline flex items-center"
              >
                View <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Cashflow Trends (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-5 lg:p-6 shadow-glass">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">7-Day Cashflow</h3>
              <p className="text-xs text-slate-400">Sales vs. Expenses</p>
            </div>

            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`px-2.5 py-0.5 rounded-lg transition ${chartType === 'area' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'text-slate-500'}`}
              >
                Area
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-0.5 rounded-lg transition ${chartType === 'bar' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'text-slate-500'}`}
              >
                Bar
              </button>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={state.weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB7185" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#FB7185" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: '#F1F5F9' }} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#FB7185" strokeWidth={1.5} fillOpacity={1} fill="url(#expGrad)" />
                </AreaChart>
              ) : (
                <BarChart data={state.weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="sales" name="Sales" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#FB7185" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Business Insights (1 col) */}
        <div className="glass-panel rounded-3xl p-5 shadow-glass flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-slate-800 text-sm">Smart Insights</h3>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                AI Advisory
              </span>
            </div>

            <div className="space-y-2.5">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-3 rounded-2xl border text-xs transition ${
                    insight.type === 'warning'
                      ? 'bg-coral-50/60 border-coral-200/70 text-coral-950'
                      : insight.type === 'tip'
                      ? 'bg-amber-50/60 border-amber-200/70 text-amber-950'
                      : 'bg-brand-50/60 border-brand-200/70 text-brand-950'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{insight.type === 'warning' ? '⚠️' : insight.type === 'tip' ? '💡' : '📈'}</span>
                    <span>{insight.title}</span>
                  </div>
                  <p className="text-[11px] opacity-85 mt-1 leading-relaxed">
                    {insight.desc}
                  </p>
                  {insight.actionText && (
                    <button
                      type="button"
                      onClick={() => {
                        if (insight.id === 'insight-stock') onNavigateTab('inventory');
                        else if (insight.id === 'insight-baki') onNavigateTab('baki');
                      }}
                      className="mt-1.5 text-[11px] font-bold flex items-center gap-1 text-slate-700 hover:text-brand-700"
                    >
                      <span>{insight.actionText}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ledger Table */}
      <div className="glass-panel rounded-3xl p-5 lg:p-6 shadow-glass">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h3 className="font-bold text-slate-800 text-sm">Recent Ledger Entries</h3>

          <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-xl text-xs font-medium">
            {['all', 'sale', 'expense', 'baki'].map((tab) => (
              <button
                key={tab}
                onClick={() => setTxFilter(tab)}
                className={`px-2.5 py-1 rounded-lg capitalize transition ${
                  txFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'all' ? 'All' : tab === 'sale' ? 'Sales' : tab === 'expense' ? 'Expenses' : 'Baki'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Payment</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.slice(0, 6).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      tx.type === 'sale' ? 'bg-brand-50 text-brand-700 border border-brand-200/60' :
                      tx.type === 'expense' ? 'bg-coral-50 text-coral-700 border border-coral-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}>
                      {tx.type === 'sale' ? 'Sale' : tx.type === 'expense' ? 'Expense' : 'Baki'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {tx.description}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {tx.customer || 'Walk-in'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {tx.paymentMethod}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                    {tx.timestamp}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold">
                    <span className={tx.type === 'expense' ? 'text-coral-600' : 'text-slate-900'}>
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
