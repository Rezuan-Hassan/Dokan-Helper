import React, { useState } from 'react';
import { HelpCircle, Send, Sparkles, Database, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { askShopQuestion } from '../services/dokanApi';

const PRESET_QUESTIONS = [
  { labelBn: "সবচেয়ে বেশি বাকি কার?", labelEn: "Who has the highest due?", query: "সবচেয়ে বেশি বাকি কার?" },
  { labelBn: "কোন কোন পণ্য স্টকে কম?", labelEn: "Which items are low in stock?", query: "কোন কোন পণ্য স্টকে কম?" },
  { labelBn: "আজকের মোট লাভ কত?", labelEn: "What is today's net profit?", query: "আজকের মোট লাভ কত?" }
];

export default function ShopQaPanel({ state }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAsk = async (queryText) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    try {
      const res = await askShopQuestion(q, state);
      setQaResult(res);
      setQuestion(q);
    } catch (err) {
      console.error(err);
      setError("Could not process question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAsk();
  };

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-glass space-y-4 border border-slate-200/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-700 flex items-center justify-center font-bold">
            <HelpCircle className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Ask Your Shop</span>
              <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                Hybrid AI Q&A
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Instant answers on dues, low stock, and profits using local hybrid retrieval + LLM synthesis
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time shop state synced</span>
        </div>
      </div>

      {/* Preset Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-medium text-slate-400">Quick queries:</span>
        {PRESET_QUESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleAsk(item.query)}
            disabled={loading}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white hover:bg-brand-50/70 border border-slate-200 hover:border-brand-300 text-slate-700 hover:text-brand-700 transition shadow-xs disabled:opacity-50"
          >
            <span className="font-medium">{item.labelBn}</span>
            <span className="text-[10px] text-slate-400 group-hover:text-brand-500">({item.labelEn})</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask in Bangla, Banglish, or English (e.g. 'রহিমের বাকি কত?', 'dim er stock koto?')..."
          className="w-full pl-4 pr-24 py-2.5 rounded-2xl text-xs bg-white border border-slate-200 focus:outline-none focus:border-brand-500 shadow-xs"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold rounded-xl transition shadow-xs"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </>
          )}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-coral-50 border border-coral-200 text-xs text-coral-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Q&A Result Presentation */}
      {qaResult && (
        <div className="p-4 rounded-2xl bg-white border border-brand-200 shadow-xs space-y-3 animate-fade-in">
          {/* Result meta header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3" />
                {qaResult.source || 'Llama 3.3 70B (Groq)'}
              </span>
              {qaResult.intent && (
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Intent: {qaResult.intent}
                </span>
              )}
            </div>

            {qaResult.keyMetric && (
              <span className="text-xs font-extrabold text-brand-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {qaResult.keyMetric}
              </span>
            )}
          </div>

          {/* Bengali primary answer */}
          {qaResult.answerBn && (
            <div className="text-sm font-semibold text-slate-900 leading-relaxed">
              {qaResult.answerBn}
            </div>
          )}

          {/* English translation / explanation */}
          {qaResult.answer && (
            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {qaResult.answer}
            </div>
          )}

          {/* Hybrid Ground Truth Context Evidence */}
          {qaResult.retrievedContext && (
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-500">Retrieved Truth:</span>
              {qaResult.retrievedContext.relevantBaki?.length > 0 && (
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                  {qaResult.retrievedContext.relevantBaki.length} Debtor(s) matched
                </span>
              )}
              {qaResult.retrievedContext.relevantInventory?.length > 0 && (
                <span className="bg-coral-50 text-coral-700 px-2 py-0.5 rounded-md border border-coral-200">
                  {qaResult.retrievedContext.relevantInventory.length} Low Stock item(s)
                </span>
              )}
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                Today Sales: ৳{qaResult.retrievedContext.metricsSummary?.todaySales || 0}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
