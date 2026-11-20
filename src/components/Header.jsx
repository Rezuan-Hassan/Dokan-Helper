import React from 'react';
import { Menu, RotateCcw, Calendar } from 'lucide-react';

export default function Header({ 
  currentTab, 
  setIsMobileOpen, 
  onResetData, 
  shopInfo 
}) {
  const tabTitles = {
    'dashboard': 'Overview',
    'ai-assistant': 'Command Center',
    'inventory': 'Inventory',
    'baki': 'Customer Dues (Baki)',
    'transactions': 'Transactions Ledger',
    'docs': 'Technical Docs & Architecture',
  };

  const title = tabTitles[currentTab] || 'Dokan Helper';

  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <h1 className="text-base lg:text-lg font-bold text-slate-800 tracking-tight">
            {title}
          </h1>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/90 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            Smart Assistant
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          <span>{dateStr}</span>
        </div>

        <button
          onClick={onResetData}
          title="Reset demo data"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1.5 rounded-xl transition border border-slate-200/60"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-brand-100 border border-brand-300 flex items-center justify-center text-brand-700 font-bold text-xs">
            MR
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-semibold text-slate-800 leading-tight">Bismillah Store</div>
          </div>
        </div>
      </div>
    </header>
  );
}
