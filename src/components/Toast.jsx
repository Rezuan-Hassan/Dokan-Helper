import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-coral-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
  };

  const borders = {
    success: "border-brand-200 bg-brand-50/95 text-brand-900 shadow-glow-emerald",
    error: "border-coral-200 bg-coral-50/95 text-coral-900",
    info: "border-amber-200 bg-amber-50/95 text-amber-900 shadow-glow-amber"
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-lg transition-all ${borders[toast.type] || borders.info}`}>
        {icons[toast.type] || icons.info}
        <div className="text-sm font-medium flex-1">
          {toast.message}
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 transition text-slate-500 hover:text-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
