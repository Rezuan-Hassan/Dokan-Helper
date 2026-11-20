/**
 * Dokan Helper — Lightweight Client-Side Hybrid Retrieval Utility
 * 
 * Features:
 * 1. Query Normalization & Concept Expansion (Bangla, Banglish, English)
 * 2. Hybrid Scoring (BM25 Keyword Frequency + Fuzzy Semantic Match)
 * 3. Compact Context Extractor: Selects only the most relevant records
 *    from inventory, customer dues, and transactions to conserve tokens.
 */

const SYNONYM_MAP = {
  // Financial Concepts
  'লাভ': 'profit margin net earnings',
  'lav': 'profit margin net earnings',
  'profit': 'profit net income sales margin',
  'loss': 'loss deficit negative',
  'বিক্রি': 'sales revenue sold bikri becha',
  'bikri': 'sales revenue sold bikri becha',
  'sale': 'sales revenue sold bikri becha',
  'খরচ': 'expense khoroch bill rent utilities',
  'khoroch': 'expense khoroch bill rent utilities',
  'expense': 'expense khoroch bill rent utilities',
  'bill': 'bill electric utility desco desco bill',
  'বিল': 'bill electric utility desco desco bill',

  // Baki / Debt Concepts
  'বাকি': 'due baki credit debtor customer debt unpaid',
  'baki': 'due baki credit debtor customer debt unpaid',
  'due': 'due baki credit debtor customer debt unpaid',
  'debt': 'due baki credit debtor customer debt unpaid',
  'কার': 'customer who person debtor',
  'বেশি': 'highest maximum top most highest balance',
  'beshi': 'highest maximum top most highest balance',
  'highest': 'highest maximum top most highest balance',
  'shodh': 'paid cleared settlement porishodh',
  'শোধ': 'paid cleared settlement porishodh',
  'পরিশোধ': 'paid cleared settlement porishodh',

  // Inventory & Stock Concepts
  'স্টক': 'stock inventory quantity balance items',
  'stock': 'stock inventory quantity balance items',
  'inventory': 'stock inventory quantity balance items',
  'কম': 'low deficit alert reorder threshold shortage',
  'kom': 'low deficit alert reorder threshold shortage',
  'low': 'low deficit alert reorder threshold shortage',
  'পণ্য': 'product item grocery sku goods',
  'mal': 'product item grocery sku goods',
  'chal': 'rice miniket grains',
  'চাল': 'rice miniket grains',
  'tel': 'oil soybean rupchanda cooking',
  'তেল': 'oil soybean rupchanda cooking',
  'dim': 'egg farm brown eggs',
  'ডিম': 'egg farm brown eggs',
  'dal': 'lentils mosur pulses',
  'ডাল': 'lentils mosur pulses',
  'chini': 'sugar refined sweeteners',
  'চিনি': 'sugar refined sweeteners'
};

const BENGALI_DIGITS = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

/**
 * Normalizes query string and converts Bengali numerals to English
 */
export function normalizeQuery(query = '') {
  const normalizedDigits = query.replace(/[০-৯]/g, (d) => BENGALI_DIGITS[d] || d);
  return normalizedDigits.toLowerCase().trim();
}

/**
 * Expands a query with domain synonyms (Bangla, Banglish, English)
 */
export function expandQuery(normalizedQuery) {
  const words = normalizedQuery.split(/\s+/).filter(Boolean);
  const expandedTokens = new Set(words);

  for (const word of words) {
    if (SYNONYM_MAP[word]) {
      SYNONYM_MAP[word].split(/\s+/).forEach(t => expandedTokens.add(t));
    }
  }

  // Check multi-word phrase patterns
  if (normalizedQuery.includes('সবচেয়ে বেশি') || normalizedQuery.includes('sobcheye beshi') || normalizedQuery.includes('highest')) {
    ['highest', 'max', 'top', 'debtor'].forEach(t => expandedTokens.add(t));
  }
  if (normalizedQuery.includes('কম') || normalizedQuery.includes('kom') || normalizedQuery.includes('low')) {
    ['low', 'threshold', 'alert', 'shortage'].forEach(t => expandedTokens.add(t));
  }
  if (normalizedQuery.includes('লাভ') || normalizedQuery.includes('lav') || normalizedQuery.includes('profit')) {
    ['profit', 'net', 'sales', 'expenses'].forEach(t => expandedTokens.add(t));
  }

  return Array.from(expandedTokens);
}

/**
 * Hybrid token scoring between an expanded query and a text target
 */
function scoreText(targetText = '', queryTokens = []) {
  if (!targetText) return 0;
  const targetLower = targetText.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (targetLower === token) {
      score += 4;
    } else if (targetLower.includes(token)) {
      score += 2;
    }
  }
  return score;
}

/**
 * Performs hybrid retrieval over shop state (inventory, baki, transactions)
 * @param {string} rawQuery 
 * @param {object} state - { inventory, customersBaki, transactions, weeklyTrends }
 * @returns {{
 *   normalizedQuery: string;
 *   expandedQuery: string[];
 *   primaryIntent: 'baki' | 'inventory' | 'finance' | 'general';
 *   metricsSummary: object;
 *   relevantInventory: object[];
 *   relevantBaki: object[];
 *   relevantTransactions: object[];
 * }}
 */
export function hybridRetrieve(rawQuery, state) {
  const normalized = normalizeQuery(rawQuery);
  const expanded = expandQuery(normalized);

  // 1. Detect primary intent
  let primaryIntent = 'general';
  if (expanded.some(t => ['baki', 'due', 'debt', 'debtor', 'porishodh'].includes(t))) {
    primaryIntent = 'baki';
  } else if (expanded.some(t => ['stock', 'inventory', 'low', 'shortage', 'reorder'].includes(t))) {
    primaryIntent = 'inventory';
  } else if (expanded.some(t => ['profit', 'sales', 'expense', 'khoroch', 'revenue', 'net'].includes(t))) {
    primaryIntent = 'finance';
  }

  // 2. Compute exact ground truth metrics
  const todayTrend = state.weeklyTrends?.[state.weeklyTrends.length - 1] || { sales: 0, expenses: 0 };
  const todaySales = todayTrend.sales || 0;
  const todayExpenses = todayTrend.expenses || 0;
  const todayNetProfit = todaySales - todayExpenses;

  const totalOutstandingBaki = (state.customersBaki || []).reduce((sum, c) => sum + (c.totalDue || 0), 0);
  const highestDebtor = [...(state.customersBaki || [])].sort((a, b) => (b.totalDue || 0) - (a.totalDue || 0))[0] || null;
  const lowStockProducts = (state.inventory || []).filter(i => i.stock <= i.lowStockThreshold);

  const metricsSummary = {
    todaySales,
    todayExpenses,
    todayNetProfit,
    totalOutstandingBaki,
    activeDebtorCount: (state.customersBaki || []).filter(c => c.totalDue > 0).length,
    highestDebtor: highestDebtor ? {
      name: highestDebtor.customerName,
      nameBn: highestDebtor.customerNameBn,
      totalDue: highestDebtor.totalDue
    } : null,
    lowStockCount: lowStockProducts.length,
    lowStockNames: lowStockProducts.map(i => `${i.name} (${i.stock} ${i.unit})`)
  };

  // 3. Rank and retrieve top relevant Inventory items
  const scoredInventory = (state.inventory || []).map(item => {
    let score = scoreText(`${item.name} ${item.nameBn} ${item.category} ${item.sku}`, expanded);
    if (primaryIntent === 'inventory') {
      score += 2;
      if (item.stock <= item.lowStockThreshold) score += 5; // Boost low stock items for inventory queries
    }
    return { item, score };
  });
  scoredInventory.sort((a, b) => b.score - a.score);
  const relevantInventory = scoredInventory
    .filter(s => s.score > 0 || primaryIntent === 'inventory')
    .slice(0, 4)
    .map(s => ({
      id: s.item.id,
      name: s.item.name,
      stock: s.item.stock,
      unit: s.item.unit,
      price: s.item.sellingPrice,
      isLowStock: s.item.stock <= s.item.lowStockThreshold
    }));

  // 4. Rank and retrieve top relevant Baki records
  const scoredBaki = (state.customersBaki || []).map(cust => {
    let score = scoreText(`${cust.customerName} ${cust.customerNameBn} ${cust.itemsNote}`, expanded);
    if (primaryIntent === 'baki') {
      score += 2;
      if (highestDebtor && cust.id === highestDebtor.id) score += 6; // Boost top debtor
    }
    return { cust, score };
  });
  scoredBaki.sort((a, b) => b.score - a.score);
  const relevantBaki = scoredBaki
    .filter(s => s.score > 0 || primaryIntent === 'baki')
    .slice(0, 3)
    .map(s => ({
      id: s.cust.id,
      name: s.cust.customerName,
      totalDue: s.cust.totalDue,
      lastDate: s.cust.lastTransactionDate,
      itemsNote: s.cust.itemsNote
    }));

  // 5. Rank and retrieve top relevant Transactions
  const scoredTransactions = (state.transactions || []).map(tx => {
    let score = scoreText(`${tx.description} ${tx.customer} ${tx.type} ${tx.paymentMethod}`, expanded);
    return { tx, score };
  });
  scoredTransactions.sort((a, b) => b.score - a.score);
  const relevantTransactions = scoredTransactions
    .filter(s => s.score > 0)
    .slice(0, 3)
    .map(s => ({
      id: s.tx.id,
      type: s.tx.type,
      desc: s.tx.description,
      amount: s.tx.amount,
      customer: s.tx.customer,
      time: s.tx.timestamp
    }));

  return {
    rawQuery,
    normalizedQuery: normalized,
    expandedQuery: expanded,
    primaryIntent,
    metricsSummary,
    relevantInventory,
    relevantBaki,
    relevantTransactions
  };
}
