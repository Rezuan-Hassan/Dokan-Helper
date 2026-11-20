import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { z } from 'zod';

// Ensure environment variables from .env are loaded
dotenv.config();

// Maximum allowed payload size: 10MB (to support base64 receipt photos)
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024;

// In-memory state-hash cache for business insights to avoid burning duplicate tokens
const insightsCache = new Map();

/**
 * Universal JSON response helper compatible with Vercel and raw Node/Vite connect middleware
 */
function sendJson(res, statusCode, data) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

/**
 * Reads stream body if not already parsed by middleware
 */
async function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_PAYLOAD_SIZE) {
        req.destroy();
        reject(new Error('PAYLOAD_TOO_LARGE'));
      }
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        resolve(null);
      }
    });
    req.on('error', reject);
  });
}

// -------------------------------------------------------------
// STRICT ZOD VALIDATION SCHEMAS
// -------------------------------------------------------------

const RequestEnvelopeSchema = z.object({
  action: z.enum(['parse_command', 'scan_receipt', 'generate_insights', 'shop_qa']),
  payload: z.record(z.any()).optional().default({})
});

const ParsedCommandOutputSchema = z.object({
  type: z.enum(['sale', 'expense', 'baki_add', 'baki_payment', 'restock']).default('sale'),
  matchedCustomerId: z.string().nullable().default(null),
  customerName: z.string().nullable().default(null),
  matchedItemId: z.string().nullable().default(null),
  itemName: z.string().nullable().default(null),
  quantity: z.number().nullable().default(null),
  unit: z.string().nullable().default(null),
  amount: z.number().default(0),
  note: z.string().default('')
});

const ReceiptScanOutputSchema = z.object({
  type: z.enum(['sale', 'expense']).default('expense'),
  item: z.string().default('Scanned Items'),
  quantity: z.string().default('1'),
  amount: z.number().default(0),
  customer: z.string().nullable().default(null),
  note: z.string().default(''),
  vendor: z.string().default('Supplier / Counter Memo'),
  lineItems: z.array(z.object({
    name: z.string().default('Item'),
    qty: z.string().default('1'),
    total: z.number().default(0)
  })).default([])
});

const InsightItemSchema = z.object({
  id: z.string().default(() => `insight-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
  type: z.enum(['warning', 'tip', 'success']).default('tip'),
  title: z.string().default(''),
  desc: z.string().default(''),
  actionText: z.string().default('View')
});

const InsightsOutputSchema = z.array(InsightItemSchema);

const ShopQaOutputSchema = z.object({
  answer: z.string().default(''),
  answerBn: z.string().default(''),
  keyMetric: z.string().default(''),
  intent: z.string().default('general')
});

// -------------------------------------------------------------
// GROQ API CALL HELPER
// -------------------------------------------------------------

async function callGroq({ model, messages, temperature = 0.2, jsonMode = true }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const payload = {
    model,
    messages,
    temperature
  };
  if (jsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  return text;
}

// -------------------------------------------------------------
// VERCEL SERVERLESS FUNCTION & VITE PROXY HANDLER
// -------------------------------------------------------------

export default async function handler(req, res) {
  // 1. Allow POST only
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method Not Allowed. Only POST is supported.' });
  }

  // 2. Read and parse request body
  let rawBody;
  try {
    rawBody = await parseBody(req);
  } catch (err) {
    if (err.message === 'PAYLOAD_TOO_LARGE') {
      return sendJson(res, 413, { error: 'Payload too large. Maximum size is 10MB.' });
    }
    return sendJson(res, 400, { error: 'Invalid JSON payload' });
  }

  // 3. Strict Zod Validation of Request Payload
  const parseResult = RequestEnvelopeSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return sendJson(res, 400, {
      error: 'Invalid request schema',
      details: parseResult.error.format()
    });
  }

  const { action, payload } = parseResult.data;
  const geminiKey = process.env.GEMINI_API_KEY;
  const hasGemini = !!(geminiKey && geminiKey.trim() !== '' && geminiKey !== 'your_gemini_api_key_here');
  const groqKey = process.env.GROQ_API_KEY;
  const hasGroq = !!(groqKey && groqKey.trim() !== '' && groqKey !== 'your_groq_api_key_here');

  if (!hasGemini && !hasGroq) {
    return sendJson(res, 200, {
      fallback: true,
      message: 'No AI API keys configured on server. Falling back to local offline engine.',
      mode: 'offline_fallback'
    });
  }

  const ai = hasGemini ? new GoogleGenAI({ apiKey: geminiKey.trim() }) : null;

  // ==========================================================================
  // ACTION 1: parse_command (Multi-Model: Gemini 2.5 Flash -> Fallback Groq Qwen/Llama)
  // ==========================================================================
  if (action === 'parse_command') {
    const text = payload?.text || '';
    const context = payload?.context || {};
    const bakiList = Array.isArray(context.bakiList) ? context.bakiList : [];
    const inventory = Array.isArray(context.inventory) ? context.inventory : [];

    if (!text.trim()) {
      return sendJson(res, 400, { error: 'No text provided for parse_command' });
    }

    const commandPrompt = `Act as an intelligent retail bookkeeping assistant for a Bangladeshi grocery shop (Mudi Dokan).
Analyze the shopkeeper's voice transcript or typed entry in Bangla, Banglish, or English:
"${text}"

CURRENT LIVE STORE CONTEXT:
[EXISTING BAKI / DEBTOR CUSTOMERS]:
${JSON.stringify(bakiList, null, 2)}

[CURRENT INVENTORY CATALOG]:
${JSON.stringify(inventory, null, 2)}

PARSING RULES & INSTRUCTIONS:
1. Transaction "type":
   - "sale": Regular retail sale of goods (e.g. "bikri", "bechlam", "বিক্রি", "sold", "cash sale").
   - "expense": Operating costs, utilities/bills, rent, transport, tea/snacks ("khoroch", "bill", "rent", "vara", "খরচ").
   - "baki_add": Customer takes goods on credit/due ("baki nilo", "bakite dilam", "বাকি", "due", "credit", "dhar").
   - "baki_payment": Customer pays back / clears existing due ("baki shodh", "shodh dilo", "baki dilo", "বাকি পরিশোধ", "পরিশোধ").
   - "restock": Shopkeeper purchases wholesale inventory ("mal kinlam", "restock", "mal anlam", "পাইকারি কিনলাম").

2. CONTEXT-AWARE INTELLIGENT MATCHING:
   - Match Customer: If the mentioned customer matches someone in [EXISTING BAKI], "matchedCustomerId" MUST be their exact "id", and "customerName" MUST be their exact "customerName". Otherwise "matchedCustomerId" is null.
   - Match Inventory: If the mentioned item matches [CURRENT INVENTORY], "matchedItemId" MUST be its exact "id", and "itemName" MUST be its exact "name". Otherwise "matchedItemId" is null.

3. NUMERIC EXTRACTION:
   - "quantity": Extract numeric quantity as a number or null (convert Bengali digits ০-৯ to 0-9). For eggs, 1 hali = 4 pcs.
   - "unit": Extract unit ("kg", "liters", "pcs", "packs").
   - "amount": Extract total Taka amount as a number (e.g. 400).
   - "note": 1-line clean summary of what was detected.

Return strictly JSON matching:
{
  "type": "sale" | "expense" | "baki_add" | "baki_payment" | "restock",
  "matchedCustomerId": string | null,
  "customerName": string | null,
  "matchedItemId": string | null,
  "itemName": string | null,
  "quantity": number | null,
  "unit": string | null,
  "amount": number,
  "note": string
}`;

    // Primary: Gemini 2.5 Flash
    if (hasGemini) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [commandPrompt],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });
        const rawJson = JSON.parse(response.text || '{}');
        const validated = ParsedCommandOutputSchema.parse(rawJson);
        return sendJson(res, 200, {
          success: true,
          source: 'Gemini 2.5 Flash',
          data: validated
        });
      } catch (geminiErr) {
        console.warn('Gemini 2.5 Flash failed for parse_command, trying Groq fallback:', geminiErr.message);
      }
    }

    // Fallback: Groq (Qwen / Llama 3.3 70B)
    if (hasGroq) {
      try {
        let rawText = '';
        try {
          rawText = await callGroq({
            model: 'qwen-2.5-32b',
            messages: [{ role: 'user', content: commandPrompt }],
            temperature: 0.1
          });
        } catch (qwenErr) {
          rawText = await callGroq({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: commandPrompt }],
            temperature: 0.1
          });
        }
        const rawJson = JSON.parse(rawText);
        const validated = ParsedCommandOutputSchema.parse(rawJson);
        return sendJson(res, 200, {
          success: true,
          source: 'Groq (Qwen / Llama Fallback)',
          data: validated
        });
      } catch (groqErr) {
        console.error('Groq fallback also failed for parse_command:', groqErr.message);
      }
    }

    return sendJson(res, 200, {
      fallback: true,
      message: 'All AI models unavailable. Using local fallback.',
      mode: 'offline_fallback'
    });
  }

  // ==========================================================================
  // ACTION 2: scan_receipt (Multimodal Receipt Image Scanning)
  // ==========================================================================
  if (action === 'scan_receipt') {
    const { image, mimeType = 'image/jpeg' } = payload || {};
    if (!image) {
      return sendJson(res, 400, { error: 'Missing base64 image data in payload' });
    }

    const cleanBase64 = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const receiptPrompt = `Act as an intelligent document OCR and bookkeeping parser for a Bangladeshi retail/wholesale trade cash memo or receipt.
Inspect this image carefully.
1. Determine if this is a wholesale supplier receipt (an "expense" for stock restock) or counter sales memo (a "sale").
2. Extract the vendor/shop name or customer name.
3. Extract the primary item or list of items and quantities.
4. Extract the total final amount in Bangladeshi Taka (৳). Notice both Bengali digits (০-৯) and English digits.
5. Provide a short 1-line summary note.

Return strictly JSON:
{
  "type": "expense" | "sale",
  "item": string,
  "quantity": string,
  "amount": number,
  "customer": string | null,
  "note": string,
  "vendor": string,
  "lineItems": [
    { "name": string, "qty": string, "total": number }
  ]
}`;

    if (hasGemini) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              }
            },
            receiptPrompt
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });
        const rawJson = JSON.parse(response.text || '{}');
        const validated = ReceiptScanOutputSchema.parse(rawJson);
        return sendJson(res, 200, {
          success: true,
          source: 'Gemini 2.5 Flash Vision',
          data: validated
        });
      } catch (geminiErr) {
        console.warn('Gemini Vision failed:', geminiErr.message);
      }
    }

    return sendJson(res, 200, {
      fallback: true,
      message: 'Receipt scan vision fallback triggered.',
      mode: 'offline_fallback'
    });
  }

  // ==========================================================================
  // ACTION 3: generate_insights (Response Cached + Groq Llama 3.3 70B -> Gemini 2.5 Flash)
  // ==========================================================================
  if (action === 'generate_insights') {
    const { summary } = payload || {};
    
    // Check in-memory state-hash cache first
    const cacheKey = JSON.stringify(summary || {});
    if (insightsCache.has(cacheKey)) {
      return sendJson(res, 200, {
        success: true,
        source: 'Cache (State-Hash)',
        data: insightsCache.get(cacheKey)
      });
    }

    const insightsPrompt = `You are an experienced retail business advisor for Bangladeshi grocery shopkeepers.
Here is the current snapshot of today's shop operations:
- Today's Sales: ৳${summary?.todaySales || 0}
- Today's Expenses: ৳${summary?.todayExpenses || 0}
- Net Profit: ৳${(summary?.todaySales || 0) - (summary?.todayExpenses || 0)}
- Total Outstanding Customer Baki (Dues): ৳${summary?.totalBaki || 0} (${summary?.debtorCount || 0} customers pending)
- Low Stock Products: ${JSON.stringify(summary?.lowStockItems || [])}

Provide exactly 2 to 3 practical, friendly, high-impact business insights or recommendations tailored for a local Bangladeshi store.
Format as JSON object with an "insights" array:
{
  "insights": [
    {
      "id": string,
      "type": "warning" | "tip" | "success",
      "title": string,
      "desc": string,
      "actionText": string
    }
  ]
}`;

    // Primary: Groq Llama 3.3 70B
    if (hasGroq) {
      try {
        const rawText = await callGroq({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: insightsPrompt }],
          temperature: 0.3
        });
        const parsed = JSON.parse(rawText);
        const list = Array.isArray(parsed) ? parsed : (parsed.insights || []);
        const validated = InsightsOutputSchema.parse(list);
        insightsCache.set(cacheKey, validated);
        return sendJson(res, 200, {
          success: true,
          source: 'Groq Llama 3.3 70B',
          data: validated
        });
      } catch (groqErr) {
        console.warn('Groq Llama 3.3 failed for generate_insights, trying Gemini fallback:', groqErr.message);
      }
    }

    // Fallback: Gemini 2.5 Flash
    if (hasGemini) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [insightsPrompt],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          }
        });
        const parsed = JSON.parse(response.text || '{}');
        const list = Array.isArray(parsed) ? parsed : (parsed.insights || []);
        const validated = InsightsOutputSchema.parse(list);
        insightsCache.set(cacheKey, validated);
        return sendJson(res, 200, {
          success: true,
          source: 'Gemini 2.5 Flash',
          data: validated
        });
      } catch (geminiErr) {
        console.error('Gemini fallback also failed for generate_insights:', geminiErr.message);
      }
    }

    return sendJson(res, 200, {
      fallback: true,
      message: 'AI unavailable for insights, using local rules.',
      mode: 'offline_fallback'
    });
  }

  // ==========================================================================
  // ACTION 4: shop_qa ("Ask Your Shop" Hybrid Q&A - Groq Llama 3.3 70B -> Gemini 2.5 Flash)
  // ==========================================================================
  if (action === 'shop_qa') {
    const { question, retrievedContext } = payload || {};
    if (!question || !question.trim()) {
      return sendJson(res, 400, { error: 'No question provided for shop_qa' });
    }

    const qaPrompt = `You are "Dokan Helper AI", the dedicated financial and operational intelligence assistant for a Bangladeshi grocery shop.
Answer the shopkeeper's question accurately using ONLY the verified shop context provided below.

QUESTION ASKED BY SHOPKEEPER:
"${question}"

VERIFIED SHOP GROUND TRUTH CONTEXT (Hybrid Retrieved):
${JSON.stringify(retrievedContext || {}, null, 2)}

GUIDELINES:
1. Provide a direct, crisp, helpful answer with exact numbers (in ৳ Taka) and names.
2. Provide both a clear English response AND an authentic, natural Bengali response ("সহজ বাংলা").
3. Extract the single most important summary metric (e.g. "৳ ৩,৪০০ বাকি (করিম স্টোর)" or "২টি পণ্য স্টকে কম" or "আজকের লাভ ৳ ১,৪৫০").
4. Return strictly a JSON object:
{
  "answer": "Clear English answer stating the exact figure, person, or stock situation.",
  "answerBn": "সহজ বাংলায় স্পষ্ট ও সরাসরি উত্তর।",
  "keyMetric": "Short badge text highlighting the key metric",
  "intent": "baki" | "inventory" | "finance" | "general"
}`;

    // Primary: Groq Llama 3.3 70B
    if (hasGroq) {
      try {
        const rawText = await callGroq({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: qaPrompt }],
          temperature: 0.2
        });
        const parsed = JSON.parse(rawText);
        const validated = ShopQaOutputSchema.parse(parsed);
        return sendJson(res, 200, {
          success: true,
          source: 'Groq Llama 3.3 70B',
          data: validated
        });
      } catch (groqErr) {
        console.warn('Groq Llama 3.3 failed for shop_qa, trying Gemini fallback:', groqErr.message);
      }
    }

    // Fallback: Gemini 2.5 Flash
    if (hasGemini) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [qaPrompt],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          }
        });
        const parsed = JSON.parse(response.text || '{}');
        const validated = ShopQaOutputSchema.parse(parsed);
        return sendJson(res, 200, {
          success: true,
          source: 'Gemini 2.5 Flash',
          data: validated
        });
      } catch (geminiErr) {
        console.error('Gemini fallback failed for shop_qa:', geminiErr.message);
      }
    }

    return sendJson(res, 200, {
      fallback: true,
      message: 'AI unavailable for Q&A, using local hybrid retrieval answer.',
      mode: 'offline_fallback'
    });
  }

  return sendJson(res, 400, { error: `Unsupported action: "${action}"` });
}
