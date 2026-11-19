import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Ensure environment variables from .env are loaded
dotenv.config();

// Maximum allowed payload size: 10MB (to support base64 receipt photos)
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024;

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

/**
 * Vercel Serverless Function & Vite Dev Proxy Handler
 */
export default async function handler(req, res) {
  // 1. Allow POST only
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method Not Allowed. Only POST is supported.' });
  }

  // 2. Read and validate request body
  let body;
  try {
    body = await parseBody(req);
  } catch (err) {
    if (err.message === 'PAYLOAD_TOO_LARGE') {
      return sendJson(res, 413, { error: 'Payload too large. Maximum size is 10MB.' });
    }
    return sendJson(res, 400, { error: 'Invalid JSON payload' });
  }

  if (!body || typeof body !== 'object') {
    return sendJson(res, 400, { error: 'Missing request body' });
  }

  const { action, payload } = body;
  if (!action) {
    return sendJson(res, 400, { error: 'Missing "action" parameter in request payload' });
  }

  // 3. Check for server-side GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return sendJson(res, 200, {
      fallback: true,
      message: 'GEMINI_API_KEY is not configured on the server. Falling back to local offline parser.',
      mode: 'offline_fallback'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // ------------------------------------------------------------------------
    // Action 1: parse_command (Context-Aware Natural Language Parser)
    // ------------------------------------------------------------------------
    if (action === 'parse_command') {
      const text = payload?.text || '';
      const context = payload?.context || {};
      const bakiList = Array.isArray(context.bakiList) ? context.bakiList : [];
      const inventory = Array.isArray(context.inventory) ? context.inventory : [];

      if (!text.trim()) {
        return sendJson(res, 400, { error: 'No text provided for parse_command' });
      }

      const prompt = `Act as an intelligent, context-aware retail bookkeeping assistant for a Bangladeshi grocery and retail shop (Mudi Dokan).
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
   - "expense": General operating costs, electricity/bills, rent, rickshaw/van fare, tea/snacks ("khoroch", "bill", "rent", "vara", "খরচ").
   - "baki_add": Customer takes goods or money on credit/due ("baki nilo", "bakite dilam", "বাকি", "due", "credit", "dhar").
   - "baki_payment": Customer pays back / clears existing due ("baki shodh", "shodh dilo", "baki dilo", "baki payment", "পরিশোধ", "cleared due").
   - "restock": Shopkeeper purchases / restocks inventory items from wholesale ("mal kinlam", "restock", "mal anlam", "পাইকারি কিনলাম").

2. CONTEXT-AWARE INTELLIGENT MATCHING:
   - Customer Matching:
     Check if the customer mentioned in the text (e.g., "রহিম মিয়া", "Rahim", "Rahim bhai", "Karim Store", "Sumon") refers to an existing debtor in the [EXISTING BAKI] list.
     - If MATCHED: "matchedCustomerId" MUST be their exact "id", and "customerName" MUST be their exact existing "customerName".
     - If NOT matched: "matchedCustomerId" MUST be null, and "customerName" should be the extracted name.
   - Inventory Matching:
     Check if the product mentioned (e.g., "চাল", "chal", "miniket", "তেল", "tel", "oil", "rupchanda", "ডিম", "dim", "egg", "ডাল", "dal", "চিনি", "sugar", "আটা", "atta", "দুধ", "milk") matches an item in the [CURRENT INVENTORY] list.
     - If MATCHED: "matchedItemId" MUST be that item's exact "id", and "itemName" MUST be that item's exact existing "name".
     - If NOT matched: "matchedItemId" MUST be null, and "itemName" should be the extracted item name.

3. NUMERIC EXTRACTION:
   - "quantity": Extract numeric quantity as a number or null (convert Bengali digits ০-৯ to 0-9). For eggs, 1 hali = 4 pcs (e.g. "৩ হালি ডিম" = 12).
   - "unit": Extract unit (e.g., "kg", "liters", "pcs", "packs"). If matched with inventory and omitted in text, use the matched item's unit.
   - "amount": Extract total Taka amount as a number (e.g. 400). Always numeric. If omitted in text, calculate as (item price * quantity).
   - "note": 1-line clean summary of what was detected and matched.

Return strictly JSON matching this structure:
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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [prompt],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });

      const responseText = response.text || '{}';
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = {
          type: 'sale',
          matchedCustomerId: null,
          customerName: null,
          matchedItemId: null,
          itemName: text,
          quantity: null,
          unit: null,
          amount: 0,
          note: 'Parsed fallback'
        };
      }

      return sendJson(res, 200, {
        success: true,
        source: 'Gemini 2.5 Flash',
        data: parsed
      });
    }

    // ------------------------------------------------------------------------
    // Action 2: scan_receipt (Multimodal Receipt Image Scanning)
    // ------------------------------------------------------------------------
    if (action === 'scan_receipt') {
      const { image, mimeType = 'image/jpeg' } = payload || {};
      if (!image) {
        return sendJson(res, 400, { error: 'Missing base64 image data in payload' });
      }

      const cleanBase64 = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const prompt = `Act as an intelligent document OCR and bookkeeping parser for a Bangladeshi retail/wholesale trade cash memo or receipt.
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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            }
          },
          prompt
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });

      const responseText = response.text || '{}';
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = {
          type: 'expense',
          item: 'Scanned Receipt Item',
          quantity: '1',
          amount: 0,
          customer: 'Supplier',
          note: 'Parsed receipt',
          lineItems: []
        };
      }

      return sendJson(res, 200, {
        success: true,
        source: 'Gemini 2.5 Flash',
        data: parsed
      });
    }

    // ------------------------------------------------------------------------
    // Action 3: generate_insights (Dynamic Business Insights)
    // ------------------------------------------------------------------------
    if (action === 'generate_insights') {
      const { summary } = payload || {};
      const prompt = `You are an experienced retail business advisor for Bangladeshi grocery shopkeepers.
Here is the current snapshot of today's shop operations:
- Today's Sales: ৳${summary?.todaySales || 0}
- Today's Expenses: ৳${summary?.todayExpenses || 0}
- Net Profit: ৳${(summary?.todaySales || 0) - (summary?.todayExpenses || 0)}
- Total Outstanding Customer Baki (Dues): ৳${summary?.totalBaki || 0} (${summary?.debtorCount || 0} customers pending)
- Low Stock Products: ${JSON.stringify(summary?.lowStockItems || [])}

Provide exactly 2 to 3 practical, friendly, high-impact business insights or recommendations tailored for a local Bangladeshi store.
Format as JSON array:
[
  {
    "id": string,
    "type": "warning" | "tip" | "success",
    "title": string,
    "desc": string,
    "actionText": string
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [prompt],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        }
      });

      const responseText = response.text || '[]';
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = [];
      }

      return sendJson(res, 200, {
        success: true,
        source: 'Gemini 2.5 Flash',
        data: parsed
      });
    }

    return sendJson(res, 400, { error: `Unsupported action: "${action}"` });

  } catch (error) {
    console.error('Gemini API Error in proxy:', error);
    return sendJson(res, 200, {
      fallback: true,
      error: error.message || 'Error communicating with Gemini API',
      mode: 'offline_fallback'
    });
  }
}
