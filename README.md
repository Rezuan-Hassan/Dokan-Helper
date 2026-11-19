# Dokan Helper (দোকান হেল্পার) 🏪
### AI-Powered Smart Retail & Grocery Management Platform for Bangladesh

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini_API-2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

**Dokan Helper** is a modern, context-aware smart retail management web application purpose-built for grocery store owners (*Mudi Dokan*) and small retailers across Bangladesh. It combines **Google Gemini 2.5 Flash** with browser-native speech recognition to support voice and text bookkeeping in **Bangla, Banglish, and English** (including Bengali numerals `০-৯`), multimodal receipt image scanning, customer credit (*Baki*) management, and real-time inventory tracking.

---

## ✨ Highlights & Key Features

- **🎙️ Multilingual Voice & Text AI Command Bar:**
  - Browser Web Speech API with live language switching (`bn-BD` / `en-US`).
  - Seamlessly handles everyday local phrases like *"Ajke 5 kg miniket chal bikri 400 taka"*, *"Rahim bhai 500 taka baki shodh dilo"*, or *"Electric bill 1200 taka khoroch"*.
  - Instant one-click stage demo presets for reliable offline presentations.

- **🧠 Context-Aware Intelligence (Zero Duplicate Records):**
  - Sends a live snapshot of existing customers and inventory items to Gemini.
  - Automatically matches Bengali and English names to exact record IDs (e.g. *"রহিম মিয়া"* or *"Rahim bhai"* updates existing debtor `"Rahim Mia"` instead of creating duplicate accounts).

- **🛡️ Human-in-the-Loop (HITL) Review Card:**
  - Extracts and displays detected transaction type, linked customer, inventory item, quantity, unit, amount (`৳`), and payment method for quick one-click confirmation before updating the ledger.

- **🧾 Multimodal Receipt OCR Scanner:**
  - Upload real photos of supplier cash memos or counter slips (JPG/PNG).
  - Gemini Vision extracts vendor details, line items, and totals in Bangladeshi Taka.

- **📊 Live Financial Dashboard & Analytics:**
  - Real-time glass KPI cards: **Today's Sales (`৳`)**, **Today's Expenses (`৳`)**, **Net Profit (`৳`)**, and **Pending Dues (`৳`)**.
  - Interactive 7-day cashflow chart powered by Recharts (switchable between curved Area and Bar column views).
  - Dynamic AI business insights generating personalized inventory and collection recommendations.

- **📦 Inventory Stock & Low-Stock Alerts:**
  - Automatic deduction on sales and credit orders.
  - Restocking support (*"20 L tel kinlam 3500 taka restock"*).
  - Visual pulse indicators for low-stock items.

- **📒 Customer Baki (Credit) Ledger:**
  - Dedicated debtor accounts with contact information and purchase notes.
  - One-click **"Mark Paid"** or voice-driven dues settlement that converts collected debts into recorded sales revenue.

---

## 🔒 Security Architecture (Zero Client API Key Leakage)

1. **No Client-Side API Exposure:** Frontend components **never** directly communicate with Google Gemini or import GenAI libraries. All AI requests route through `POST /api/gemini`.
2. **Server-Side Environment Variables:** The key is strictly read via `process.env.GEMINI_API_KEY` on the server.
3. **Dual-Environment Proxy (`api/gemini.js`):**
   - **Local Dev:** Handled by Vite connect middleware in `vite.config.js`.
   - **Production:** Functions natively as a Vercel Serverless Function without separate backend servers.
4. **Offline Demo Fallback:** If the API key is unconfigured, rate-limited, or offline, an embedded rule-based parser silently handles commands with an `"Offline Demo"` badge so live presentations never crash.

---

## 📁 Project Architecture

```
dokan-helper/
├── api/
│   └── gemini.js            # Secure server-side proxy (Gemini 2.5 Flash SDK)
├── public/
├── src/
│   ├── components/
│   │   ├── BakiView.jsx              # Customer credit ledger & settlement
│   │   ├── CommandBar.jsx            # Voice, text, and receipt upload bar
│   │   ├── DashboardView.jsx         # KPI cards, Recharts trends & AI insights
│   │   ├── Header.jsx                # Minimalist header with live status
│   │   ├── HitlConfirmationModal.jsx # Human-in-the-loop review card
│   │   ├── InventoryView.jsx         # Stock tracking & low stock warnings
│   │   ├── ReceiptScanModal.jsx      # Vision scanner animation & modal
│   │   ├── Sidebar.jsx               # Navigation drawer with quick stats
│   │   ├── Toast.jsx                 # Glassmorphic feedback notifications
│   │   └── TransactionsView.jsx      # Ledger history with CSV export
│   ├── services/
│   │   └── dokanApi.js      # Unified service layer, state persistence & fallback NLP
│   ├── App.jsx              # Main app container & workflow orchestration
│   ├── index.css            # Tailwind directives & glassmorphic primitives
│   └── main.jsx             # React entry point
├── .env.example             # Environment variable template
├── .gitignore               # Strict secret & build exclusion rules
├── package.json
├── tailwind.config.js       # Cream/emerald design theme tokens
└── vite.config.js           # Vite configuration with local proxy middleware
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node v24)
- npm or pnpm

### 1. Clone the repository
```bash
git clone https://github.com/your-username/dokan-helper.git
cd dokan-helper
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Gemini API Key
Create a `.env` file from the provided template:
```bash
cp .env.example .env
```
Open `.env` and add your Google Gemini API key:
```env
GEMINI_API_KEY=AIzaSy...your_real_gemini_api_key_here
```
> *Note: If you run without an API key, the app will automatically run in **Offline Demo Mode** using its built-in rule-based parser.*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. In **Project Settings → Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key.
4. Click **Deploy**. Vercel will automatically configure both the Vite frontend and `/api/gemini.js` serverless function.

---

## 🧪 Production Build & Bundle Verification

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License
This project is licensed under the MIT License.
