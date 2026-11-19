import React, { useState, useEffect } from 'react';
import { Camera, X, Loader2, ArrowRight } from 'lucide-react';
import { simulateReceiptScan, formatTaka } from '../services/dokanApi';

export default function ReceiptScanModal({ 
  isOpen, 
  onClose, 
  onReceiptProcessed,
  presetType = 'wholesale_memo' 
}) {
  if (!isOpen) return null;

  const [scanning, setScanning] = useState(true);
  const [scanStep, setScanStep] = useState(1);
  const [scannedData, setScannedData] = useState(null);

  useEffect(() => {
    let timer1, timer2;
    if (isOpen) {
      setScanning(true);
      setScanStep(1);
      setScannedData(null);

      timer1 = setTimeout(() => setScanStep(2), 400);
      timer2 = setTimeout(() => setScanStep(3), 800);

      simulateReceiptScan(presetType).then((result) => {
        setScannedData(result);
        setScanning(false);
      });
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, presetType]);

  const handleApplyToHITL = () => {
    if (!scannedData) return;
    
    const primaryItem = scannedData.lineItems[0];
    onReceiptProcessed({
      rawPrompt: `Receipt: ${scannedData.vendor}`,
      source: scannedData.source || 'Gemini 2.5 Flash',
      parsed: {
        type: scannedData.transactionType,
        title: `${scannedData.vendor}`,
        amount: scannedData.totalAmount,
        quantity: primaryItem?.qty || null,
        unit: primaryItem?.unit || 'units',
        matchedItem: primaryItem?.name || null,
        matchedInventoryId: primaryItem?.matchedInventoryId || null,
        customerName: scannedData.customerName || scannedData.vendor,
        category: scannedData.category,
        confidence: scannedData.confidence,
        reasoning: `Extracted ${scannedData.lineItems.length} line items from ${scannedData.vendor}. Total verified: ${formatTaka(scannedData.totalAmount)}.`
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Document Vision Scanner
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {scanning ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="relative w-56 h-36 rounded-2xl bg-slate-100 border border-amber-300 overflow-hidden flex flex-col justify-between p-3.5">
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-[0_0_8px_#10B981] animate-bounce" />

                <div className="space-y-1.5 opacity-40">
                  <div className="h-2.5 bg-slate-300 rounded w-3/4"></div>
                  <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                </div>

                <div className="flex justify-between items-center opacity-40 border-t border-slate-300 pt-2">
                  <div className="h-2 bg-slate-300 rounded w-1/4"></div>
                  <div className="h-2.5 bg-slate-400 rounded w-1/3"></div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>
                  {scanStep === 1 && "Detecting memo fields..."}
                  {scanStep === 2 && "Extracting line items..."}
                  {scanStep === 3 && "Verifying totals..."}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 mb-2">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{scannedData.vendor}</div>
                    <div className="text-[10px] text-slate-500">{scannedData.receiptId} • {scannedData.date}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                    {scannedData.confidence}% Accuracy
                  </span>
                </div>

                <div className="space-y-1.5">
                  {scannedData.lineItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-0.5">
                      <span className="text-slate-700">{item.name} ({item.qty})</span>
                      <span className="font-semibold text-slate-800">{formatTaka(item.total)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2.5 pt-2 border-t border-amber-200 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600">Total:</span>
                  <span className="text-sm font-extrabold text-brand-700">{formatTaka(scannedData.totalAmount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyToHITL}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-xs transition active:scale-95"
                >
                  <span>Review in HITL</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
