import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CommandBar from './components/CommandBar';
import HitlConfirmationModal from './components/HitlConfirmationModal';
import ReceiptScanModal from './components/ReceiptScanModal';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import BakiView from './components/BakiView';
import TransactionsView from './components/TransactionsView';
import ShopQaPanel from './components/ShopQaPanel';
import DocsView from './components/DocsView';
import Toast from './components/Toast';

import { 
  getDokanState, 
  saveDokanState, 
  resetDokanDemoData, 
  parseVoiceOrTextCommand, 
  scanReceiptWithGemini,
  confirmTransaction, 
  markBakiPaid,
  formatTaka
} from './services/dokanApi';

export default function App() {
  const [state, setState] = useState(() => getDokanState());
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/docs') {
      return 'docs';
    }
    return 'dashboard';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const handleTabChange = (tabId) => {
    setCurrentTab(tabId);
    if (typeof window !== 'undefined') {
      const targetPath = tabId === 'docs' ? '/docs' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/docs') {
        setCurrentTab('docs');
      } else {
        setCurrentTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // AI & HITL Modals
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [parsedHitlData, setParsedHitlData] = useState(null);
  const [isHitlModalOpen, setIsHitlModalOpen] = useState(false);
  
  // Receipt Scan Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptPreset, setReceiptPreset] = useState('wholesale_memo');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleResetData = () => {
    if (window.confirm("Reset all store records back to clean demo data?")) {
      const reset = resetDokanDemoData();
      setState({ ...reset });
      showToast("Store demo data reset to default", "info");
    }
  };

  const handleCommandSubmit = async (queryText) => {
    setIsProcessingCommand(true);
    try {
      const result = await parseVoiceOrTextCommand(queryText);
      setParsedHitlData(result);
      setIsHitlModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast("Could not parse command. Please check input.", "error");
    } finally {
      setIsProcessingCommand(false);
    }
  };

  // Upload real receipt image file
  const handleUploadReceiptImage = async (base64Data, mimeType) => {
    setIsProcessingCommand(true);
    try {
      showToast("Scanning receipt with Gemini Vision...", "info");
      const scanRes = await scanReceiptWithGemini(base64Data, mimeType);
      const primaryItem = scanRes.lineItems?.[0];
      setParsedHitlData({
        rawPrompt: `Receipt: ${scanRes.vendor}`,
        source: scanRes.source || 'Gemini 2.5 Flash',
        parsed: {
          type: scanRes.transactionType || 'expense',
          title: scanRes.vendor || 'Scanned Receipt',
          amount: scanRes.totalAmount || 0,
          quantity: primaryItem?.qty || null,
          unit: primaryItem?.unit || 'units',
          matchedItem: primaryItem?.name || null,
          customerName: scanRes.customerName || scanRes.vendor || 'Supplier',
          category: scanRes.category || 'Inventory Restock',
          confidence: scanRes.confidence || 98,
          reasoning: `Extracted ${scanRes.lineItems?.length || 1} line item(s) from ${scanRes.vendor}. Total verified: ${formatTaka(scanRes.totalAmount)}.`
        }
      });
      setIsHitlModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast("Failed to process receipt image", "error");
    } finally {
      setIsProcessingCommand(false);
    }
  };

  const handleTriggerReceiptScan = (preset = 'wholesale_memo') => {
    setReceiptPreset(preset);
    setIsReceiptModalOpen(true);
  };

  const handleReceiptProcessed = (ocrResult) => {
    setParsedHitlData(ocrResult);
    setIsHitlModalOpen(true);
  };

  const handleConfirmHitl = async (finalTxData) => {
    try {
      const res = await confirmTransaction(finalTxData);
      setState({ ...res.state });
      setIsHitlModalOpen(false);
      setParsedHitlData(null);
      showToast(res.message, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to commit transaction", "error");
    }
  };

  const handleMarkPaid = async (bakiId) => {
    try {
      const res = await markBakiPaid(bakiId);
      setState({ ...res.state });
      showToast(res.message, "success");
    } catch (err) {
      console.error(err);
      showToast("Error processing payment", "error");
    }
  };

  const handleUpdateStock = (itemId, newStockCount) => {
    const updated = { ...state };
    const idx = updated.inventory.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      updated.inventory[idx].stock = newStockCount;
      saveDokanState(updated);
      setState({ ...updated });
      showToast(`Stock updated: ${updated.inventory[idx].name}`);
    }
  };

  const handleAddNewBaki = async (newBakiData) => {
    try {
      const res = await confirmTransaction(newBakiData);
      setState({ ...res.state });
      showToast(`Recorded due of ${formatTaka(newBakiData.amount)} for ${newBakiData.customerName}`, "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to record due", "error");
    }
  };

  const handleSendSms = (customer) => {
    showToast(`📱 SMS reminder queued for ${customer.customerName} (${formatTaka(customer.totalDue)})`, "info");
  };

  return (
    <div className="min-h-screen bg-cream-100 text-slate-800 flex font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onResetData={handleResetData}
        state={state}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header */}
        <Header
          currentTab={currentTab}
          setIsMobileOpen={setIsMobileOpen}
          onResetData={handleResetData}
          shopInfo={state.shopInfo}
        />

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Always Visible AI Command Bar */}
          <section>
            <CommandBar
              onCommandSubmit={handleCommandSubmit}
              onTriggerReceiptScan={handleTriggerReceiptScan}
              onUploadReceiptImage={handleUploadReceiptImage}
              isProcessing={isProcessingCommand}
            />
          </section>

          {/* Active Tab View */}
          {currentTab === 'dashboard' && (
            <DashboardView
              state={state}
              onNavigateTab={handleTabChange}
            />
          )}

          {currentTab === 'ai-assistant' && (
            <div className="space-y-6">
              {/* Ask Your Shop AI Q&A Panel */}
              <ShopQaPanel state={state} />

              <div className="glass-panel rounded-3xl p-6 shadow-glass">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">
                      Context-Aware Multi-Model Engine
                    </h2>
                    <p className="text-xs text-slate-400">
                      Real-time inventory stock matching, debtor ledger linking & Groq/Gemini routing
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    Live Shop Context Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-xl mb-1 block">⚡</span>
                    <div className="font-bold text-xs text-slate-800">Multi-Model Routing</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Gemini 2.5 Flash for multimodal parsing & Groq Llama 3.3 70B for lightning-fast business Q&A.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-xl mb-1 block">🎙️</span>
                    <div className="font-bold text-xs text-slate-800">Continuous Bangla Voice</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Web Speech recognition streams continuous transcripts with Bengali numeral translation (০-৯).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-xl mb-1 block">🛡️</span>
                    <div className="font-bold text-xs text-slate-800">Zod Schema Guardrails</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Every payload and AI response is strictly validated against Zod schemas before state mutation.
                    </p>
                  </div>
                </div>
              </div>

              <DashboardView
                state={state}
                onNavigateTab={handleTabChange}
              />
            </div>
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              state={state}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {currentTab === 'baki' && (
            <BakiView
              state={state}
              onMarkPaid={handleMarkPaid}
              onAddNewBaki={handleAddNewBaki}
              onSendSms={handleSendSms}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsView
              state={state}
            />
          )}

          {currentTab === 'docs' && (
            <DocsView state={state} onNavigateTab={handleTabChange} />
          )}
        </main>
      </div>

      {/* Human-in-the-Loop Confirmation Modal */}
      <HitlConfirmationModal
        isOpen={isHitlModalOpen}
        onClose={() => setIsHitlModalOpen(false)}
        parsedResult={parsedHitlData}
        onConfirm={handleConfirmHitl}
        inventoryList={state.inventory}
        bakiList={state.customersBaki}
      />

      {/* Receipt Scan Modal */}
      <ReceiptScanModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onReceiptProcessed={handleReceiptProcessed}
        presetType={receiptPreset}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
