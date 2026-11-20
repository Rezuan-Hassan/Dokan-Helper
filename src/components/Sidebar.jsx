import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Package, 
  BookOpen, 
  Receipt, 
  RotateCcw, 
  Store, 
  MapPin,
  FileText
} from 'lucide-react';
import { formatTaka } from '../services/dokanApi';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  isMobileOpen, 
  setIsMobileOpen, 
  onResetData, 
  state 
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-assistant', label: 'Smart Assistant', icon: Sparkles },
    { id: 'inventory', label: 'Inventory', icon: Package, count: state.inventory.filter(i => i.stock <= i.lowStockThreshold).length },
    { id: 'baki', label: 'Baki / Dues', icon: BookOpen, count: state.customersBaki.filter(c => c.totalDue > 0).length },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'docs', label: 'Docs & API', icon: FileText },
  ];

  const totalDue = state.customersBaki.reduce((sum, c) => sum + (c.totalDue || 0), 0);
  const todaySales = state.weeklyTrends[state.weeklyTrends.length - 1]?.sales || 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white/85 backdrop-blur-2xl border-r border-slate-200/80
        flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-sm shadow-brand-500/25">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-base tracking-tight flex items-center gap-1.5">
                Dokan Helper
              </div>
              <p className="text-[11px] text-slate-400">Mirpur-10, Dhaka</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all
                  ${isActive 
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25 font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {item.count > 0 && !item.badge && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white/25 text-white' 
                      : item.id === 'inventory' ? 'bg-coral-100 text-coral-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Snapshot & Reset */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/40 space-y-3">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Sales:</span>
              <span className="font-bold text-brand-700">{formatTaka(todaySales)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Dues:</span>
              <span className="font-bold text-amber-700">{formatTaka(totalDue)}</span>
            </div>
          </div>

          <button
            onClick={onResetData}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </aside>
    </>
  );
}
