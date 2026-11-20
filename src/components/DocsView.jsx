import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Cpu, 
  Copy, 
  Check, 
  Layers, 
  Network, 
  ArrowRight, 
  Terminal, 
  Code2, 
  Lock, 
  Sparkles, 
  Database,
  ExternalLink
} from 'lucide-react';

export default function DocsView() {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const PROMPT_TEMPLATES = [
    {
      title: "1. parse_command (Context-Aware Natural Language Parser)",
      role: "Bangla / Banglish Bookkeeping Voice & Text Interpreter",
      model: "Primary: Gemini 2.5 Flash | Fallback: Groq Qwen-2.5-32B",
      prompt: `Act as an intelligent retail bookkeeping assistant for a Bangladeshi grocery shop (Mudi Dokan).
Analyze the shopkeeper's voice transcript or typed entry in Bangla, Banglish, or English:
"\${text}"

CURRENT LIVE STORE CONTEXT:
[EXISTING BAKI / DEBTOR CUSTOMERS]: \${JSON.stringify(bakiList)}
[CURRENT INVENTORY CATALOG]: \${JSON.stringify(inventory)}

PARSING RULES:
1. Transaction "type": "sale" | "expense" | "baki_add" | "baki_payment" | "restock"
2. Match customer exact id & existing customerName if found in debtor list.
3. Match inventory exact id & name if found in catalog.
4. Extract numeric quantities (convert Bengali digits ০-৯ to 0-9; 1 hali = 4 pcs).
5. Output strict JSON with: type, matchedCustomerId, customerName, matchedItemId, itemName, quantity, unit, amount, note.`
    },
    {
      title: "2. shop_qa ('Ask Your Shop' Hybrid Retrieval Q&A)",
      role: "Store Operational & Financial Intelligence Synthesizer",
      model: "Primary: Groq Llama 3.3 70B | Fallback: Gemini 2.5 Flash",
      prompt: `You are "Dokan Helper AI", the dedicated financial and operational assistant for a Bangladeshi grocery shop.
Answer the shopkeeper's question accurately using ONLY the verified shop context provided below.

QUESTION: "\${question}"
VERIFIED CONTEXT (Hybrid Retrieved): \${JSON.stringify(retrievedContext)}

GUIDELINES:
1. Provide a direct, crisp answer with exact numbers (in ৳ Taka) and customer names.
2. Provide both clear English answer AND natural Bengali response ("সহজ বাংলা").
3. Extract key summary metric badge (e.g. "৳ ৩,৪০০ বাকি (করিম স্টোর)").
4. Output JSON: { answer, answerBn, keyMetric, intent }`
    },
    {
      title: "3. scan_receipt (Multimodal Cash Memo OCR)",
      role: "Vision Document & Ledger Item Extractor",
      model: "Gemini 2.5 Flash Vision (Direct multimodal base64)",
      prompt: `Act as an intelligent document OCR and bookkeeping parser for a Bangladeshi retail/wholesale trade cash memo or receipt.
1. Determine if this is a wholesale supplier receipt (expense) or counter sales memo (sale).
2. Extract vendor/customer name, line items with quantities, and total final Taka (৳) amount.
3. Handle Bengali numerals (০-৯) and handwritten numbers.
4. Output JSON: { type, item, quantity, amount, customer, note, vendor, lineItems }`
    },
    {
      title: "4. generate_insights (Cached Business Optimization)",
      role: "Daily Dokan Advisor & Reorder Optimizer",
      model: "Primary: Groq Llama 3.3 70B (State-Hash Cached) | Fallback: Gemini 2.5 Flash",
      prompt: `You are an experienced retail business advisor for Bangladeshi grocery shopkeepers.
Here is the current snapshot of today's shop operations:
- Today's Sales: ৳\${todaySales}
- Today's Expenses: ৳\${todayExpenses}
- Outstanding Baki: ৳\${totalBaki} (\${debtorCount} customers)
- Low Stock Products: \${JSON.stringify(lowStockItems)}

Provide 2-3 practical, high-impact recommendations formatted as JSON array:
[{ "id": string, "type": "warning"|"tip"|"success", "title": string, "desc": string, "actionText": string }]`
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Title Hero */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Production Architecture Specification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dokan Helper Technical Whitepaper & API Docs
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Complete architectural documentation for the secure multi-model AI pipeline, client-side hybrid retrieval engine, and human-in-the-loop bookkeeping safety layers.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Version</span>
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-mono font-bold">
              v2.4.0 (score-boost)
            </span>
          </div>
        </div>
      </div>

      {/* Visual Flow Diagram */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass space-y-4 border border-slate-200/80">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <Network className="w-5 h-5 text-brand-600" />
          <span>System End-to-End Architecture Flow</span>
        </div>
        <p className="text-xs text-slate-500">
          How voice, text, and receipt inputs flow through client-side retrieval, server-side security proxies, multi-model routing, and state persistence.
        </p>

        {/* Interactive Diagram Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
            <div className="w-8 h-8 mx-auto rounded-xl bg-cream-200 text-slate-800 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div className="font-bold text-xs text-slate-800">Shopkeeper Input</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              Continuous Bangla Voice, Banglish text, or Cash Memo Photo
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-brand-200 text-center space-y-2">
            <div className="w-8 h-8 mx-auto rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div className="font-bold text-xs text-brand-900">Hybrid Retrieval</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              BM25 token expansion + Bengali numeral normalizer extracts top context
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
            <div className="w-8 h-8 mx-auto rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div className="font-bold text-xs text-slate-800">Secure Proxy API</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">POST /api/gemini</code> with Zod payload validation
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-brand-200 text-center space-y-2">
            <div className="w-8 h-8 mx-auto rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div className="font-bold text-xs text-brand-900">Multi-Model Routing</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              Gemini 2.5 Flash & Groq Llama 3.3 70B / Qwen fallback
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-emerald-200 text-center space-y-2">
            <div className="w-8 h-8 mx-auto rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              5
            </div>
            <div className="font-bold text-xs text-emerald-900">HITL Approval</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              Human-in-the-Loop review before atomic ledger commit
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Model Routing Strategy Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass space-y-4 border border-slate-200/80">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <Cpu className="w-5 h-5 text-brand-600" />
          <span>Multi-Model Dynamic Routing Matrix</span>
        </div>
        <p className="text-xs text-slate-500">
          Tasks are assigned to optimal frontier models based on modality, latency, and analytical reasoning requirements.
        </p>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-2.5 px-3">Action Route</th>
                <th className="py-2.5 px-3">Primary Model</th>
                <th className="py-2.5 px-3">Fallback Path</th>
                <th className="py-2.5 px-3">Optimization / Caching</th>
                <th className="py-2.5 px-3">Guardrail Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-3 font-mono font-bold text-slate-800">parse_command</td>
                <td className="py-3 px-3 text-brand-700 font-semibold">Gemini 2.5 Flash</td>
                <td className="py-3 px-3 text-slate-600">Groq (Qwen-2.5-32B / Llama 3.3)</td>
                <td className="py-3 px-3 text-slate-500">Context pruning (IDs only)</td>
                <td className="py-3 px-3 text-emerald-700 font-medium">Zod ParsedCommandSchema</td>
              </tr>
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-3 font-mono font-bold text-slate-800">scan_receipt</td>
                <td className="py-3 px-3 text-brand-700 font-semibold">Gemini 2.5 Flash Vision</td>
                <td className="py-3 px-3 text-slate-600">Preset OCR Engine</td>
                <td className="py-3 px-3 text-slate-500">Base64 stream limit (10MB)</td>
                <td className="py-3 px-3 text-emerald-700 font-medium">Zod ReceiptScanSchema</td>
              </tr>
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-3 font-mono font-bold text-slate-800">generate_insights</td>
                <td className="py-3 px-3 text-brand-700 font-semibold">Groq Llama 3.3 70B</td>
                <td className="py-3 px-3 text-slate-600">Gemini 2.5 Flash</td>
                <td className="py-3 px-3 text-indigo-700 font-semibold">In-memory State-Hash Cache</td>
                <td className="py-3 px-3 text-emerald-700 font-medium">Zod InsightsArraySchema</td>
              </tr>
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-3 font-mono font-bold text-slate-800">shop_qa</td>
                <td className="py-3 px-3 text-brand-700 font-semibold">Groq Llama 3.3 70B</td>
                <td className="py-3 px-3 text-slate-600">Gemini 2.5 Flash</td>
                <td className="py-3 px-3 text-slate-500">Hybrid BM25 token retrieval</td>
                <td className="py-3 px-3 text-emerald-700 font-medium">Zod ShopQaOutputSchema</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Prompt Engineering Library */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass space-y-4 border border-slate-200/80">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <Terminal className="w-5 h-5 text-brand-600" />
          <span>System Prompt Engineering Library</span>
        </div>
        <p className="text-xs text-slate-500">
          The verified system prompts powering Dokan Helper's structured bookkeeping output. Click copy to inspect.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {PROMPT_TEMPLATES.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs text-slate-800">{item.title}</h4>
                  <button
                    onClick={() => handleCopy(item.prompt, idx)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-brand-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                    title="Copy prompt"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-brand-600" />
                        <span className="text-brand-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{item.role}</div>
                <div className="text-[10px] font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md inline-block mt-2">
                  {item.model}
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                {item.prompt}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Guardrails Roadmap */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass space-y-4 border border-slate-200/80">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <Lock className="w-5 h-5 text-brand-600" />
          <span>Security, Validation & Safety Guardrails</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero Client Exposure</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Neither <code className="text-slate-800">GEMINI_API_KEY</code> nor <code className="text-slate-800">GROQ_API_KEY</code> are bundled into client JavaScript. All requests route through the serverless function.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-brand-600" />
              <span>Zod Schema Enforcement</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every incoming request and raw LLM output is validated against strict Zod schemas before being accepted or rendered in the UI.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-amber-600" />
              <span>Offline Fallback Parity</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              If upstream LLM endpoints experience outages or rate limits, the app seamlessly falls back to client-side regex and deterministic retrieval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
