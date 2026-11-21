import React, { useState, useEffect, useMemo } from 'react';
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
  ExternalLink,
  Search,
  Sliders,
  Calendar,
  Clock,
  Printer,
  Download,
  Share2,
  Users,
  Target,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Edit3,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Key,
  DollarSign,
  Package,
  BookOpen,
  Receipt,
  Server,
  Cloud,
  Smartphone,
  Globe,
  Radio,
  X
} from 'lucide-react';
import { formatTaka } from '../services/dokanApi';

// ----------------------------------------------------------------------
// DEFAULT TEAM & CONFIGURATION DATA (Team "Straw Hat")
// ----------------------------------------------------------------------

const INITIAL_TEAM_MEMBERS = [
  {
    id: 'team-1',
    name: 'Rezuan Hassan',
    role: 'Team Lead & Full-Stack AI Architect',
    email: '252-15-045@diu.edu.bd',
    photo: '/team/leader.jpg',
    isNrb: false,
    bio: 'End-to-end architect of Dokan Helper: Web Speech streaming, multi-model AI routing, serverless proxy & HITL financial safety systems.'
  },
  {
    id: 'team-2',
    name: 'K. M. Mehedy Hasan',
    role: 'Lead Machine Learning & NLP Engineer',
    email: '252-15-119@diu.edu.bd',
    photo: '/team/member1.jpg',
    isNrb: false,
    bio: 'Specialized in Bangla & Banglish phonetic tokenization, dialect normalization, and client-side hybrid BM25 retrieval algorithms.'
  },
  {
    id: 'team-3',
    name: 'Md. Sabbir Ahmed',
    role: 'Frontend Architect & Mobile Experience Lead',
    email: '252-15-619@diu.edu.bd',
    photo: '/team/member2.jpg',
    isNrb: false,
    bio: 'Crafted liquid-glass responsive UI surfaces, Web Speech recognition state machines, and real-time ledger animations.'
  },
  {
    id: 'team-4',
    name: 'Abdullah Al Jaber',
    role: 'Backend Systems & Cloud Infrastructure Lead',
    email: '252-15-548@diu.edu.bd',
    photo: '/team/member3.jpg',
    isNrb: false,
    bio: 'Engineered Vercel serverless proxy functions, state-hash response caching, and Zod runtime schema validation guardrails.'
  },
  {
    id: 'team-5',
    name: 'Musfiqur Rahman Khan Sompod',
    role: 'Global Market Strategist & NRB Partnerships Lead',
    email: 'sompodpubg@gmail.com',
    photo: '/team/member4.jpg',
    isNrb: true,
    bio: 'Non-Resident Bangladeshi (NRB) diaspora partnerships, cross-border remittance-backed merchant credit, and international SaaS growth.'
  },
  {
    id: 'team-6',
    name: 'Ishrat Jahan Abedin Ooishee',
    role: 'Product Designer & Merchant UX Researcher',
    email: '252-15-114@diu.edu.bd',
    photo: '/team/member5.jpg',
    isNrb: false,
    bio: 'Conducts ground-level mudir dokan merchant interviews in Dhaka to eliminate UI friction for busy, non-technical shopkeepers.'
  }
];

const DEFAULT_DOCS_CONFIG = {
  visibilityMode: 'public_override', // 'public_override' | 'schedule' | 'offline'
  scheduleStart: '2026-06-10T00:00',
  scheduleEnd: '2026-06-14T23:59',
  teamName: 'Straw Hat',
  youtubeEmbedUrl: 'https://www.youtube.com/embed/RorJJeAx33A',
  team: INITIAL_TEAM_MEMBERS,
  hiddenSections: []
};

export default function DocsView({ state: liveState, onNavigateTab }) {
  // Config state persisted in localStorage
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('dokan_docs_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.youtubeEmbedUrl === 'https://www.youtube.com/embed/dQw4w9WgXcQ' || !parsed.youtubeEmbedUrl) {
          parsed.youtubeEmbedUrl = 'https://www.youtube.com/embed/RorJJeAx33A';
        }
        if (Array.isArray(parsed.team)) {
          parsed.team = parsed.team.map(m => {
            if (m.name && m.name.includes('Sabbir')) {
              return {
                ...m,
                role: 'Frontend Architect & Mobile Experience Lead',
                bio: 'Crafted liquid-glass responsive UI surfaces, Web Speech recognition state machines, and real-time ledger animations.',
                isNrb: false
              };
            }
            if (m.name && (m.name.includes('Musfiqur') || m.name.includes('Mushfiqur') || m.name.includes('Sompod') || m.name.includes('Sampad'))) {
              return {
                ...m,
                role: 'Global Market Strategist & NRB Partnerships Lead',
                bio: 'Non-Resident Bangladeshi (NRB) diaspora partnerships, cross-border remittance-backed merchant credit, and international SaaS growth.',
                isNrb: true
              };
            }
            return m;
          });
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load docs config:', e);
    }
    return DEFAULT_DOCS_CONFIG;
  });

  // Admin access state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('pitch-deck');
  const [toastMessage, setToastMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Edit Team state inside Admin Panel
  const [editingMember, setEditingMember] = useState(null);

  // Save config to localStorage
  const saveConfig = (newConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('dokan_docs_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Failed to persist docs config:', e);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Determine visibility
  const isAccessible = useMemo(() => {
    if (isAdminMode) return true;
    if (config.visibilityMode === 'public_override') return true;
    if (config.visibilityMode === 'offline') return false;
    if (config.visibilityMode === 'schedule') {
      const now = new Date();
      const start = new Date(config.scheduleStart);
      const end = new Date(config.scheduleEnd);
      return now >= start && now <= end;
    }
    return true;
  }, [config, isAdminMode]);

  // Handle Admin PIN verification
  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === '2026') {
      setIsAdminMode(true);
      setIsAdminModalOpen(false);
      setPinInput('');
      setPinError('');
      showToast('Admin Mode Unlocked (Demo PIN: 2026)');
    } else {
      setPinError('Incorrect Passcode. Use demo PIN: 2026');
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Export full documentation as Markdown file
  const handleExportMarkdown = () => {
    const md = `# Dokan Helper — Technical Whitepaper & YC Pitch Deck
**Team:** ${config.teamName}
**Generated:** ${new Date().toLocaleString()}

## Executive Summary
Dokan Helper is an AI-powered smart business management platform tailored for small retail shops and grocery store owners (Mudir Dokan) in Bangladesh.

### Core Architecture
- **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons + Recharts
- **Security:** Zero client-side API key exposure. All LLM calls proxy via \`/api/gemini\`
- **AI Routing:** Frontier multi-model router (Google Gemini + Groq Qwen/Llama) with 3-tier offline resilience
- **Verification:** Zod schema validation & Human-in-the-Loop (HITL) approval

## Team "${config.teamName}"
${config.team.map((m, idx) => `${idx + 1}. **${m.name}** — ${m.role} (${m.email})${m.isNrb ? ' [NRB]' : ''}\n   _${m.bio}_`).join('\n\n')}

## Live Ground Truth Metrics
- Total Recorded Sales: ${formatTaka(liveState?.weeklyTrends?.reduce((sum, d) => sum + (d.sales || 0), 0) || 0)}
- Outstanding Baki (Dues): ${formatTaka(liveState?.customersBaki?.reduce((sum, c) => sum + (c.totalDue || 0), 0) || 0)}
- Tracked Products: ${liveState?.inventory?.length || 0} items
`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dokan-helper-docs.md';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported dokan-helper-docs.md');
  };

  // Copy shareable link
  const handleCopyLink = () => {
    const url = window.location.origin + '/docs';
    navigator.clipboard.writeText(url);
    showToast(`Shareable Link Copied: ${url}`);
  };

  // Section Navigation Index
  const SECTIONS = [
    { id: 'pitch-deck', title: 'YC Pitch Deck (12 Slides)', icon: Target },
    { id: 'team-section', title: 'Team "Straw Hat"', icon: Users },
    { id: 'product-overview', title: 'Product Overview', icon: Smartphone },
    { id: 'live-analytics', title: 'Live System Analytics', icon: TrendingUp },
    { id: 'feature-matrix', title: 'Live Feature Matrix', icon: Layers },
    { id: 'architecture', title: 'Architecture Diagram', icon: Network },
    { id: 'data-flow', title: 'Data Flow Diagram', icon: Radio },
    { id: 'tech-stack', title: 'Technology Stack', icon: Cpu },
    { id: 'api-docs', title: 'API Documentation', icon: Code2 },
    { id: 'data-layer', title: 'Data Layer & Privacy', icon: Database },
    { id: 'ai-layer', title: 'AI Layer & Routing', icon: Sparkles },
    { id: 'roadmap', title: 'Product Roadmap', icon: Calendar },
    { id: 'scalability', title: 'Performance & Scale', icon: Server },
    { id: 'security', title: 'Security & Guardrails', icon: ShieldCheck },
    { id: 'changelog', title: 'Changelog', icon: Clock }
  ];

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.filter(s => s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [searchQuery]);

  // Compute live shop metrics directly from app state
  const totalSales = useMemo(() => {
    if (!liveState?.weeklyTrends) return 0;
    return liveState.weeklyTrends.reduce((sum, d) => sum + (d.sales || 0), 0);
  }, [liveState]);

  const totalExpenses = useMemo(() => {
    if (!liveState?.weeklyTrends) return 0;
    return liveState.weeklyTrends.reduce((sum, d) => sum + (d.expenses || 0), 0);
  }, [liveState]);

  const netProfit = totalSales - totalExpenses;

  const totalBaki = useMemo(() => {
    if (!liveState?.customersBaki) return 0;
    return liveState.customersBaki.reduce((sum, c) => sum + (c.totalDue || 0), 0);
  }, [liveState]);

  // ----------------------------------------------------------------------
  // RENDER: 403 SCREEN (When visibility is offline or outside schedule)
  // ----------------------------------------------------------------------
  if (!isAccessible) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          403 — Documentation Currently Unavailable
        </h2>
        <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
          The Dokan Helper technical whitepaper and pitch deck are scheduled by the team. Access window is currently restricted.
        </p>

        {config.visibilityMode === 'schedule' && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-700">Scheduled Judging Window:</div>
            <div>Start: {new Date(config.scheduleStart).toLocaleString()}</div>
            <div>End: {new Date(config.scheduleEnd).toLocaleString()}</div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition shadow-xs"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Admin / Judge Unlock (PIN: 2026)</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              Back to Live Shop
            </button>
          )}
        </div>

        {/* Unlock PIN Modal */}
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-left">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-600" />
                <span>Admin Passcode Verification</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter admin PIN to view documentation or edit availability settings.
              </p>
              <form onSubmit={handleVerifyPin} className="mt-4 space-y-3">
                <div>
                  <input
                    type="password"
                    placeholder="Enter PIN (Demo: 2026)"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-500 font-mono tracking-widest text-center"
                    autoFocus
                  />
                  {pinError && <div className="text-[11px] text-coral-600 mt-1">{pinError}</div>}
                  <div className="text-[10px] text-slate-400 mt-1.5 text-center">
                    💡 Subtle Hint for Judges: Demo PIN is <code className="bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-700">2026</code>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsAdminModalOpen(false); setPinError(''); }}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-xs"
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER: MAIN FULL /DOCS MODULE (YC Deck + Tech Specs + Live Sync)
  // ----------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-medium shadow-xl animate-fade-in print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action & Navigation Header */}
      <div className="glass-panel rounded-3xl p-5 shadow-glass border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              YC-Style Pitch Deck & Technical Whitepaper
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              v1.3 Production
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Dokan Helper — Global Standard Documentation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time synced documentation, system architecture, team portfolio & live operational telemetry.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-semibold transition"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Back to Dokan</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            title="Copy shareable link"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            title="Download complete documentation as Markdown"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export .md</span>
          </button>

          <button
            onClick={() => window.print()}
            title="Print or save as PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {/* Admin Mode Toggle */}
          <button
            onClick={() => {
              if (isAdminMode) {
                setIsAdminMode(false);
                showToast('Admin Mode Deactivated');
              } else {
                setIsAdminModalOpen(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs ${
              isAdminMode 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isAdminMode ? 'Admin Active' : 'Admin Panel'}</span>
          </button>
        </div>
      </div>

      {/* Admin Panel Drawer / Bar (Visible when Admin Mode is ON) */}
      {isAdminMode && (
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-300 text-slate-800 space-y-3 animate-fade-in print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Admin Control Active — Visibility, Scheduling & Team Editor
              </span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all documentation configurations and team roster back to clean defaults?')) {
                  saveConfig(DEFAULT_DOCS_CONFIG);
                  showToast('Documentation config reset to default');
                }
              }}
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Visibility Mode Selector */}
            <div className="bg-white p-3 rounded-2xl border border-amber-200 space-y-1.5">
              <label className="font-bold text-slate-700 block text-[11px]">Visibility Status</label>
              <select
                value={config.visibilityMode}
                onChange={(e) => saveConfig({ ...config, visibilityMode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
              >
                <option value="public_override">✅ Always Public (Override Active)</option>
                <option value="schedule">⏱️ Use Schedule Window</option>
                <option value="offline">🔒 Offline / Unavailable (403)</option>
              </select>
              <p className="text-[10px] text-slate-500">
                Default: Always Public for immediate judging access.
              </p>
            </div>

            {/* Schedule Window Start */}
            <div className="bg-white p-3 rounded-2xl border border-amber-200 space-y-1.5">
              <label className="font-bold text-slate-700 block text-[11px]">Judging Window Start</label>
              <input
                type="datetime-local"
                value={config.scheduleStart}
                onChange={(e) => saveConfig({ ...config, scheduleStart: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs"
              />
              <span className="text-[10px] text-slate-400">Pre-filled: June 10, 2026 (00:00)</span>
            </div>

            {/* Schedule Window End */}
            <div className="bg-white p-3 rounded-2xl border border-amber-200 space-y-1.5">
              <label className="font-bold text-slate-700 block text-[11px]">Judging Window End</label>
              <input
                type="datetime-local"
                value={config.scheduleEnd}
                onChange={(e) => saveConfig({ ...config, scheduleEnd: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs"
              />
              <span className="text-[10px] text-slate-400">Pre-filled: June 14, 2026 (23:59)</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Sticky Navigation + Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sticky Sidebar Navigation */}
        <aside className="lg:sticky lg:top-20 space-y-4 print:hidden">
          {/* Instant Search Bar */}
          <div className="glass-panel rounded-2xl p-3 shadow-glass border border-slate-200/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search specs, team, API..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 focus:outline-none focus:border-brand-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Table of Contents */}
          <div className="glass-panel rounded-3xl p-3 shadow-glass border border-slate-200/80 space-y-1 max-h-[70vh] overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Contents ({filteredSections.length})
            </div>
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                    isActive 
                      ? 'bg-brand-500 text-white font-semibold shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{sec.title}</span>
                </a>
              );
            })}
          </div>

          {/* Quick Stats Pill */}
          <div className="glass-card rounded-2xl p-3.5 text-xs space-y-1.5 border border-slate-200/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live System Sync</div>
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Sales:</span>
              <span className="text-brand-700">{formatTaka(totalSales)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Baki Dues:</span>
              <span className="text-amber-700">{formatTaka(totalBaki)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Products:</span>
              <span className="text-slate-800">{liveState?.inventory?.length || 0} SKUs</span>
            </div>
          </div>
        </aside>

        {/* Right Content Stream */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* ==================================================================== */}
          {/* SECTION A: YC-STYLE PITCH DECK (12 Comprehensive Slides) */}
          {/* ==================================================================== */}
          <section id="pitch-deck" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                YC Pitch Deck Structure
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                Dokan Helper: The Voice AI Operating System for South Asian Retail
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Standard 12-slide Y-Combinator format detailing the problem, solution, economics, moats, and vision.
              </p>
            </div>

            {/* 1. Problem */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-coral-50 text-coral-600 font-bold text-xs flex items-center justify-center">1</span>
                <h3 className="font-bold text-slate-900 text-sm">The Problem: 80%+ of Bangladeshi Mudir Dokans are Stuck on Fragile Paper</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Over 1.5 million neighborhood grocery shops manage millions of Taka in sales and credit ('Baki') on damp, coffee-stained paper notebooks.
                Traditional POS systems are English-only, require expensive hardware scanners, and demand endless keyboard typing during busy market hours.
                As a result, shopkeepers lose <strong>৳ 50,000–৳ 200,000 annually</strong> in uncollected dues, arithmetic mistakes, and inventory stockouts.
              </p>
            </div>

            {/* 2. Solution */}
            <div className="p-5 rounded-2xl bg-white border border-brand-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">2</span>
                <h3 className="font-bold text-slate-900 text-sm">The Solution: One-Tap Voice Bookkeeping with Human-in-the-Loop Safety</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Dokan Helper allows a busy shopkeeper to tap once, speak natural Bangla or Banglish (e.g. <em>"রহিম ভাই ৫ কেজি মিনিকেট চাল বাকি নিল ৪০০ টাকা"</em>),
                and watches the AI automatically link the transaction to existing debtor records, deduct 5kg from inventory, and log the ledger.
                Before any state change occurs, a clear <strong>Human-in-the-Loop (HITL) approval modal</strong> lets the merchant review and adjust with a single click.
              </p>
            </div>

            {/* 3. Why Now */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">3</span>
                <h3 className="font-bold text-slate-900 text-sm">Why Now? The Convergence of Affordable 4G, Smartphones & Sub-Second LLMs</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Five years ago, natural speech-to-text in Bengali was unusable, smartphones were expensive, and LLM inference cost dollars per prompt.
                Today, 4G covers 95% of Bangladesh, mobile financial services (bKash/Nagad) have normalized digital balance tracking, and ultra-fast frontier models
                (Gemini 2.5/3.8 Flash and Groq Llama 3.3) parse complete transactions in <strong>under 450ms for a fraction of a cent</strong>.
              </p>
            </div>

            {/* 4. Product Demo */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center">4</span>
                  <h3 className="font-bold text-slate-900 text-sm">Interactive Product Demo</h3>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    <span>Launch Live Interactive Shop</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Experience real-time speech recognition, receipt image OCR, and intelligent hybrid Q&A in the live application.
              </p>
              <div className="pl-8 pt-1">
                <div className="aspect-video w-full max-w-xl rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner flex items-center justify-center text-slate-400 text-xs">
                  <iframe 
                    className="w-full h-full"
                    src={config.youtubeEmbedUrl} 
                    title="Dokan Helper Video Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="mt-2.5">
                  <a
                    href="https://youtu.be/RorJJeAx33A?si=Gb0c6skEkwyJBQcL"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition"
                  >
                    <span>Watch Demo on YouTube (https://youtu.be/RorJJeAx33A)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-brand-600" />
                  </a>
                </div>
              </div>
            </div>

            {/* 5. Market Opportunity */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">5</span>
                <h3 className="font-bold text-slate-900 text-sm">Market Opportunity: 1.5M+ Shops in Bangladesh, 15M+ across South Asia</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-8">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Total Addressable (TAM)</div>
                  <div className="text-base font-extrabold text-slate-800 mt-1">15,000,000+</div>
                  <div className="text-[11px] text-slate-500">Shops across South Asia ($4.5B)</div>
                </div>
                <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
                  <div className="text-[10px] font-bold text-brand-700 uppercase">Serviceable (SAM)</div>
                  <div className="text-base font-extrabold text-brand-900 mt-1">1,500,000+</div>
                  <div className="text-[11px] text-brand-700">Shops in Bangladesh ($450M)</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Target (SOM)</div>
                  <div className="text-base font-extrabold text-emerald-900 mt-1">50,000 Dokans</div>
                  <div className="text-[11px] text-emerald-700">Tier 1 & 2 Urban Hubs ($15M ARR)</div>
                </div>
              </div>
            </div>

            {/* 6. Business Model */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center">6</span>
                <h3 className="font-bold text-slate-900 text-sm">Business Model: Freemium SaaS + FMCG B2B Distributor Insights</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-8">
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="font-bold text-xs text-slate-800">Free Community Tier</div>
                  <div className="text-base font-extrabold text-brand-600 my-1">৳ 0 / mo</div>
                  <p className="text-[11px] text-slate-500">Core voice bookkeeping, local storage, manual CSV export, up to 50 entries/mo.</p>
                </div>
                <div className="p-3 rounded-xl border border-brand-300 bg-brand-50/50">
                  <div className="font-bold text-xs text-brand-900">Dokan Pro</div>
                  <div className="text-base font-extrabold text-brand-700 my-1">৳ 299 / mo</div>
                  <p className="text-[11px] text-slate-600">Unlimited voice entries, Cloud sync, automated WhatsApp/SMS Baki reminders, AI supplier price checks.</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="font-bold text-xs text-slate-800">Enterprise Distributor Feed</div>
                  <div className="text-base font-extrabold text-slate-800 my-1">Custom B2B</div>
                  <p className="text-[11px] text-slate-500">Aggregated FMCG demand forecasting, inventory restocking feeds, and distributor merchant credit rating.</p>
                </div>
              </div>
            </div>

            {/* 7. Traction */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center">7</span>
                <h3 className="font-bold text-slate-900 text-sm">Traction & Engineering Milestones</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-8">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-base font-extrabold text-brand-700">Live MVP</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Vercel Deployed</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-base font-extrabold text-slate-800">&lt; 450 ms</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">AI Response Latency</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-base font-extrabold text-emerald-700">100% Zero Leak</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Zero Client Key Exposure</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-base font-extrabold text-indigo-700">3-Tier Fallback</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Offline-First Engine</div>
                </div>
              </div>
            </div>

            {/* 8. Competition */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center">8</span>
                <h3 className="font-bold text-slate-900 text-sm">Competitive Matrix: Why Dokan Helper Wins</h3>
              </div>
              <div className="overflow-x-auto pl-8">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                      <th className="py-2 px-2">Capability</th>
                      <th className="py-2 px-2 text-brand-700">Dokan Helper</th>
                      <th className="py-2 px-2">TallyKhata</th>
                      <th className="py-2 px-2">Paper Baki Khata</th>
                      <th className="py-2 px-2">Traditional POS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="py-2 px-2 font-medium">Continuous Bangla Voice</td>
                      <td className="py-2 px-2 font-bold text-emerald-600">✅ Web Speech API</td>
                      <td className="py-2 px-2 text-slate-400">❌ Manual typing</td>
                      <td className="py-2 px-2 text-slate-400">❌ Physical pen</td>
                      <td className="py-2 px-2 text-slate-400">❌ English keyboard</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-medium">Context Entity Matching</td>
                      <td className="py-2 px-2 font-bold text-emerald-600">✅ Live ID Resolver</td>
                      <td className="py-2 px-2 text-slate-400">❌ Manual dropdown</td>
                      <td className="py-2 px-2 text-slate-400">❌ Missing links</td>
                      <td className="py-2 px-2 text-slate-400">⚠️ Barcodes required</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-medium">Multi-Model AI Failover</td>
                      <td className="py-2 px-2 font-bold text-emerald-600">✅ Gemini + Groq</td>
                      <td className="py-2 px-2 text-slate-400">❌ None</td>
                      <td className="py-2 px-2 text-slate-400">❌ None</td>
                      <td className="py-2 px-2 text-slate-400">❌ None</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-medium">Hardware Investment</td>
                      <td className="py-2 px-2 font-bold text-emerald-600">📱 Zero (Any Browser)</td>
                      <td className="py-2 px-2">📱 Phone App</td>
                      <td className="py-2 px-2">📓 Notebook</td>
                      <td className="py-2 px-2 text-coral-600">🖥️ ৳ 50,000+ Setup</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 9. Unique Advantage */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 font-bold text-xs flex items-center justify-center">9</span>
                <h3 className="font-bold text-slate-900 text-sm">Unique Advantage (Unfair Moat)</h3>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pl-8 list-disc list-inside">
                <li><strong>Bangla Dialect & Numeral Normalization:</strong> Custom regex and phonetic dictionary translates colloquial units (হালি, কেজি, পোয়া) and numerals (০-৯) instantly.</li>
                <li><strong>Hybrid Client-Side Retrieval:</strong> Prunes store catalog to only matching entities before calling backend LLMs, cutting inference tokens by 75%.</li>
                <li><strong>Strict Zod Financial Guardrails:</strong> Every AI response is validated through mathematical schemas preventing phantom numbers or corrupt states.</li>
              </ul>
            </div>

            {/* 10. Go-to-Market */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 font-bold text-xs flex items-center justify-center">10</span>
                <h3 className="font-bold text-slate-900 text-sm">Go-To-Market: Hyper-Local Market Clusters & Merchant Referral Loops</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                We launch market-by-market in dense retail hubs (Mirpur-10, Karwan Bazar, Mohammadpur Town Hall). 
                Field ambassadors onboard shopkeepers in 60 seconds with zero signup barrier. 
                Merchants receive 20 free automated WhatsApp SMS reminders for every neighbor shop they refer, igniting viral word-of-mouth.
              </p>
            </div>

            {/* 11. Team Preview Header */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-xs flex items-center justify-center">11</span>
                <h3 className="font-bold text-slate-900 text-sm">The Team: Team "{config.teamName}"</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Engineering-heavy multidisciplinary team from Daffodil International University (DIU) with full-stack AI, ML, NRB market access, and distributed systems expertise. See full roster below in Section 2.
              </p>
            </div>

            {/* 12. Vision */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center">12</span>
                <h3 className="font-bold text-slate-900 text-sm">The Vision: Default Voice Operating System for Emerging Markets</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                In 5 years, Dokan Helper will power the financial identity, creditworthiness, and automated inventory supply chain for over 250,000 neighborhood micro-merchants across South Asia, turning analog corner stores into digitally connected community fulfillment hubs.
              </p>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION B: TEAM "STRAW HAT" (All 6 Real Members) */}
          {/* ==================================================================== */}
          <section id="team-section" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  Core Founders & Engineering Roster
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                  Team "{config.teamName}"
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  The builders behind Dokan Helper's speech parsing, multi-model backend, and merchant experience.
                </p>
              </div>

              {isAdminMode && (
                <button
                  onClick={() => {
                    const newMember = {
                      id: `team-${Date.now()}`,
                      name: 'New Teammate',
                      role: 'Software Engineer',
                      email: 'teammate@dokanhelper.app',
                      photo: '/logo.jpeg',
                      isNrb: false,
                      bio: 'Contributing to Dokan Helper core modules.'
                    };
                    saveConfig({ ...config, team: [...config.team, newMember] });
                    showToast('Added new teammate card');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Teammate</span>
                </button>
              )}
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {config.team.map((member) => (
                <div 
                  key={member.id} 
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-brand-300 transition-all shadow-xs flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-3">
                    {/* Photo + Badges */}
                    <div className="flex items-start justify-between">
                      <div className="relative">
                        <img
                          src={member.photo}
                          alt={member.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                        {/* Fallback Initials Avatar */}
                        <div 
                          style={{ display: 'none' }}
                          className="w-16 h-16 rounded-2xl bg-brand-100 border border-brand-300 text-brand-700 font-extrabold text-lg items-center justify-center"
                        >
                          {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>

                        {member.isNrb && (
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-extrabold shadow-xs">
                            NRB
                          </span>
                        )}
                      </div>

                      {isAdminMode && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingMember(member)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                            title="Edit Member"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${member.name}?`)) {
                                saveConfig({
                                  ...config,
                                  team: config.team.filter(m => m.id !== member.id)
                                });
                                showToast(`Deleted ${member.name}`);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-coral-600 rounded-lg hover:bg-slate-100"
                            title="Delete Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Member Info */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                      <div className="text-[11px] font-semibold text-brand-700 leading-tight mt-0.5">
                        {member.role}
                      </div>
                      <a 
                        href={`mailto:${member.email}`} 
                        className="text-[11px] text-slate-400 hover:text-brand-600 truncate block mt-0.5"
                      >
                        {member.email}
                      </a>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Inline Member Edit Modal in Admin Mode */}
            {editingMember && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 text-sm">Edit Teammate</h4>
                    <button 
                      onClick={() => setEditingMember(null)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Name</label>
                      <input
                        type="text"
                        value={editingMember.name}
                        onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Role</label>
                      <input
                        type="text"
                        value={editingMember.role}
                        onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Email</label>
                      <input
                        type="email"
                        value={editingMember.email}
                        onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Photo URL or Base64</label>
                      <input
                        type="text"
                        value={editingMember.photo}
                        onChange={(e) => setEditingMember({ ...editingMember, photo: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Bio / Contributions</label>
                      <textarea
                        rows={2}
                        value={editingMember.bio}
                        onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="nrbCheck"
                        checked={editingMember.isNrb || false}
                        onChange={(e) => setEditingMember({ ...editingMember, isNrb: e.target.checked })}
                        className="rounded text-brand-600"
                      />
                      <label htmlFor="nrbCheck" className="font-medium text-slate-700">Mark as Non-Resident Bangladeshi (NRB)</label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setEditingMember(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        saveConfig({
                          ...config,
                          team: config.team.map(m => m.id === editingMember.id ? editingMember : m)
                        });
                        setEditingMember(null);
                        showToast(`Updated ${editingMember.name}`);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-semibold shadow-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ==================================================================== */}
          {/* SECTION C: PRODUCT OVERVIEW */}
          {/* ==================================================================== */}
          <section id="product-overview" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Module Overview
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Product Overview & Daily Workflow
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dokan Helper is designed specifically around the daily sensory reality of a Bangladeshi grocery store: noisy surroundings, wet hands, fast-paced customer banter, and heavy reliance on informal customer credit ("Baki").
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-800">Target Users</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Local grocery shopkeepers, tea stall owners, wholesalers, and roadside convenience retail stores throughout Bangladesh.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-800">Core Daily Workflows</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Recording counter cash sales, adding customer due, settling Baki payments, logging operating expenses (rent, electricity), and receiving wholesale delivery memos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-800">Zero Typing Mandate</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Voice recognition operates continuously until manually stopped, eliminating keyboard typos and allowing merchants to record sales without wiping flour or spices from their hands.
                </p>
              </div>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION D: LIVE SYSTEM ANALYTICS (Auto-Synced with Live App State) */}
          {/* ==================================================================== */}
          <section id="live-analytics" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  Real-Time Telemetry
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Live System Analytics
                </h2>
                <p className="text-xs text-slate-500">
                  Auto-synced with Dokan Helper's active ledger. Updates automatically as transactions occur.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live State Active
              </span>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Sales</div>
                <div className="text-lg font-extrabold text-brand-700 mt-1">{formatTaka(totalSales)}</div>
                <div className="text-[10px] text-slate-400">Total revenue logged</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Expenses</div>
                <div className="text-lg font-extrabold text-coral-600 mt-1">{formatTaka(totalExpenses)}</div>
                <div className="text-[10px] text-slate-400">Utilities, restock, bills</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Net Profit</div>
                <div className="text-lg font-extrabold text-slate-800 mt-1">{formatTaka(netProfit)}</div>
                <div className="text-[10px] text-emerald-600 font-medium">Sales minus costs</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Pending Baki</div>
                <div className="text-lg font-extrabold text-amber-700 mt-1">{formatTaka(totalBaki)}</div>
                <div className="text-[10px] text-amber-600 font-medium">Customer dues to collect</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Catalog SKUs</div>
                <div className="text-lg font-extrabold text-slate-800 mt-1">{liveState?.inventory?.length || 0} Products</div>
                <div className="text-[10px] text-slate-400">Rice, oil, eggs, pulses</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Ledger Rows</div>
                <div className="text-lg font-extrabold text-brand-700 mt-1">{liveState?.transactions?.length || 0} Records</div>
                <div className="text-[10px] text-slate-400">Immutable ledger items</div>
              </div>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION E: LIVE FEATURE MATRIX */}
          {/* ==================================================================== */}
          <section id="feature-matrix" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Feature Roadmap Matrix
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Feature Matrix & Development Phases
            </h2>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="py-2.5 px-3">Feature Name</th>
                    <th className="py-2.5 px-3">Phase / Stage</th>
                    <th className="py-2.5 px-3">Live Status</th>
                    <th className="py-2.5 px-3">Underlying Tech</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold">Continuous Voice Recording with Square Stop</td>
                    <td className="py-2.5 px-3">Phase 1 (MVP)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Production Live</span></td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">Web Speech API + isListeningRef</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold">Frontier Multi-Model Router (Gemini + Groq)</td>
                    <td className="py-2.5 px-3">Phase 1 (MVP)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Production Live</span></td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">Gemini 3.8/2.5 Flash + Groq Qwen 3.8</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold">Zod Schema Guardrails & Safe Coercion</td>
                    <td className="py-2.5 px-3">Phase 1 (MVP)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Production Live</span></td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">Zod v3 Runtime Sanitization</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold">Ask Your Shop Hybrid Q&A (Bangla/Banglish)</td>
                    <td className="py-2.5 px-3">Phase 1 (MVP)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Production Live</span></td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">BM25 Hybrid Retrieval + LLM</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold">1-Click UTF-8 BOM CSV Export</td>
                    <td className="py-2.5 px-3">Phase 1 (MVP)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Production Live</span></td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">Blob(\uFEFF + UTF-8) for Excel</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold">WhatsApp Cloud API Baki Payment Links</td>
                    <td className="py-2.5 px-3">Phase 2</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">In Progress</span></td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">Meta WhatsApp Cloud API Webhooks</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold">PostgreSQL Cloud Sync + Multi-Device</td>
                    <td className="py-2.5 px-3">Phase 2</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">In Progress</span></td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">Supabase Auth + Row-Level Security</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold">bKash / Nagad QR Payment Webhooks</td>
                    <td className="py-2.5 px-3">Phase 3</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px]">Planned</span></td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">MFS Merchant Webhooks</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION F: ARCHITECTURE DIAGRAM (Clean SVG Visual) */}
          {/* ==================================================================== */}
          <section id="architecture" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              System Blueprint
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              End-to-End System Architecture
            </h2>
            <p className="text-xs text-slate-500">
              Clean visual pipeline depicting client UI, local hybrid retrieval, Vercel serverless proxy, multi-model failover, and persistence.
            </p>

            <div className="pt-2">
              <svg viewBox="0 0 900 240" className="w-full h-auto rounded-2xl bg-white border border-slate-200 p-2 shadow-xs">
                <defs>
                  <linearGradient id="gradBrand" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="gradProxy" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                  <linearGradient id="gradModel" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6D28D9" />
                  </linearGradient>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
                  </marker>
                </defs>

                {/* Box 1: Client UI */}
                <rect x="20" y="30" width="150" height="90" rx="16" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                <text x="95" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0F172A">Browser Client UI</text>
                <text x="95" y="85" textAnchor="middle" fontSize="10" fill="#64748B">React + Web Speech</text>
                <text x="95" y="100" textAnchor="middle" fontSize="9" fill="#10B981">Continuous Voice</text>

                {/* Arrow 1 -> 2 */}
                <line x1="170" y1="75" x2="205" y2="75" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />

                {/* Box 2: Client Hybrid Retrieval */}
                <rect x="210" y="30" width="160" height="90" rx="16" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
                <text x="290" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#065F46">Hybrid Retrieval</text>
                <text x="290" y="85" textAnchor="middle" fontSize="10" fill="#047857">hybridRetrieval.js</text>
                <text x="290" y="100" textAnchor="middle" fontSize="9" fill="#059669">BM25 + Bengali Normalizer</text>

                {/* Arrow 2 -> 3 */}
                <line x1="370" y1="75" x2="405" y2="75" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />

                {/* Box 3: Vercel Proxy */}
                <rect x="410" y="30" width="150" height="90" rx="16" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" />
                <text x="485" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1E40AF">Vercel Proxy API</text>
                <text x="485" y="85" textAnchor="middle" fontSize="10" fill="#2563EB">/api/gemini</text>
                <text x="485" y="100" textAnchor="middle" fontSize="9" fill="#1D4ED8">Zero Key Exposure</text>

                {/* Arrow 3 -> 4 */}
                <line x1="560" y1="75" x2="595" y2="75" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />

                {/* Box 4: Multi-Model Router */}
                <rect x="600" y="20" width="180" height="110" rx="16" fill="#F5F3FF" stroke="#8B5CF6" strokeWidth="2" />
                <text x="690" y="48" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#5B21B6">Multi-Model Router</text>
                <rect x="615" y="58" width="150" height="26" rx="8" fill="#FFFFFF" stroke="#DDD6FE" />
                <text x="690" y="75" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#7C3AED">Gemini 3.8/2.5 Flash</text>
                <rect x="615" y="90" width="150" height="26" rx="8" fill="#FFFFFF" stroke="#DDD6FE" />
                <text x="690" y="107" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6D28D9">Groq Qwen 3.8 / Llama 3.3</text>

                {/* Feedback loop back down to HITL & Storage */}
                <path d="M 690 130 L 690 185 L 350 185" fill="none" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />

                {/* Box 5: HITL Safety & Persistence */}
                <rect x="180" y="150" width="160" height="70" rx="16" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="2" />
                <text x="260" y="178" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#92400E">Zod Schema + HITL</text>
                <text x="260" y="196" textAnchor="middle" fontSize="10" fill="#B45309">Approval & Local Storage</text>
              </svg>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION G: DATA FLOW DIAGRAM (Clean SVG Visual) */}
          {/* ==================================================================== */}
          <section id="data-flow" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Execution Lifecycle
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Data Flow & Transaction Mutation Lifecycle
            </h2>
            <p className="text-xs text-slate-500">
              Step-by-step transaction processing from voice input to local ledger update.
            </p>

            <div className="pt-2">
              <svg viewBox="0 0 900 160" className="w-full h-auto rounded-2xl bg-white border border-slate-200 p-2 shadow-xs">
                {/* 5 Sequential Circles */}
                <g transform="translate(40, 25)">
                  <circle cx="50" cy="50" r="38" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
                  <text x="50" y="46" textAnchor="middle" fontSize="18">🎙️</text>
                  <text x="50" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065F46">Voice / Text</text>
                  <text x="50" y="110" textAnchor="middle" fontSize="10" fill="#64748B">1. Raw Input</text>
                </g>

                <line x1="140" y1="75" x2="190" y2="75" stroke="#CBD5E1" strokeWidth="2" markerEnd="url(#arrow)" />

                <g transform="translate(200, 25)">
                  <circle cx="50" cy="50" r="38" fill="#F0FDF4" stroke="#22C55E" strokeWidth="2" />
                  <text x="50" y="46" textAnchor="middle" fontSize="18">🔍</text>
                  <text x="50" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#15803D">Retrieval</text>
                  <text x="50" y="110" textAnchor="middle" fontSize="10" fill="#64748B">2. Prune State</text>
                </g>

                <line x1="300" y1="75" x2="350" y2="75" stroke="#CBD5E1" strokeWidth="2" markerEnd="url(#arrow)" />

                <g transform="translate(360, 25)">
                  <circle cx="50" cy="50" r="38" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" />
                  <text x="50" y="46" textAnchor="middle" fontSize="18">⚡</text>
                  <text x="50" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1D4ED8">AI Router</text>
                  <text x="50" y="110" textAnchor="middle" fontSize="10" fill="#64748B">3. Gemini/Groq</text>
                </g>

                <line x1="460" y1="75" x2="510" y2="75" stroke="#CBD5E1" strokeWidth="2" markerEnd="url(#arrow)" />

                <g transform="translate(520, 25)">
                  <circle cx="50" cy="50" r="38" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="2" />
                  <text x="50" y="46" textAnchor="middle" fontSize="18">🛡️</text>
                  <text x="50" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#B45309">Zod Validate</text>
                  <text x="50" y="110" textAnchor="middle" fontSize="10" fill="#64748B">4. Sanitization</text>
                </g>

                <line x1="620" y1="75" x2="670" y2="75" stroke="#CBD5E1" strokeWidth="2" markerEnd="url(#arrow)" />

                <g transform="translate(680, 25)">
                  <circle cx="50" cy="50" r="38" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2" />
                  <text x="50" y="46" textAnchor="middle" fontSize="18">✅</text>
                  <text x="50" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0F172A">HITL Commit</text>
                  <text x="50" y="110" textAnchor="middle" fontSize="10" fill="#64748B">5. Store Sync</text>
                </g>
              </svg>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION H: TECHNOLOGY STACK */}
          {/* ==================================================================== */}
          <section id="tech-stack" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Stack Architecture
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Technology Stack Categorization
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-brand-600" />
                  <span>Frontend Client</span>
                </div>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• React 18 + Vite (SPA)</li>
                  <li>• Tailwind CSS (Glassmorphism UI)</li>
                  <li>• Lucide React Icons</li>
                  <li>• Recharts (7-day trend graphs)</li>
                  <li>• Web Speech API (continuous mode)</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span>Backend & Routing</span>
                </div>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Vercel Serverless Function (\`/api/gemini\`)</li>
                  <li>• Vite Dev Server Connect Middleware</li>
                  <li>• Node.js runtime environment</li>
                  <li>• Dotenv environment isolation</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>AI & Model Routing</span>
                </div>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• @google/genai (Gemini 3.8/2.5 Flash)</li>
                  <li>• Groq Cloud API (Qwen 3.8 27B)</li>
                  <li>• Groq Llama 3.3 70B Versatile</li>
                  <li>• Client-side Hybrid BM25 Retrieval</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>Storage & State</span>
                </div>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Browser LocalStorage (\`dokan_store_state\`)</li>
                  <li>• In-memory State-Hash Cache</li>
                  <li>• UTF-8 BOM CSV Export Engine</li>
                  <li>• Phase 2: Supabase PostgreSQL</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Guardrails & Validation</span>
                </div>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Zod v3 Runtime Sanitization</li>
                  <li>• Safe Number Preprocessing</li>
                  <li>• Human-in-the-Loop Confirmation</li>
                  <li>• Zero Client Key Exposure</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-indigo-600" />
                  <span>Deployment & CI/CD</span>
                </div>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• GitHub Automated Continuous Delivery</li>
                  <li>• Vercel Edge Global CDN</li>
                  <li>• vercel.json SPA Route Rewrites</li>
                  <li>• Zero-downtime atomic builds</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION I: API DOCUMENTATION */}
          {/* ==================================================================== */}
          <section id="api-docs" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              API Interface
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Serverless API Specification: POST /api/gemini
            </h2>
            <p className="text-xs text-slate-500">
              All client interactions route through a single hardened endpoint protected by server-side credentials.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs space-y-2">
                <div className="text-emerald-400 font-bold">POST /api/gemini</div>
                <div className="text-slate-400 text-[11px]">Headers: Content-Type: application/json</div>
                <div className="text-slate-300">Payload Envelope Schema:</div>
                <pre className="text-[11px] text-slate-400 overflow-x-auto">
{`{
  "action": "parse_command" | "scan_receipt" | "generate_insights" | "shop_qa",
  "payload": { ...actionSpecificFields }
}`}
                </pre>
              </div>

              {/* Action 1: parse_command */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800">1. Action: parse_command</h4>
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">Natural Language</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Parses Bangla, Banglish, or English merchant voice input. Accepts live store context (existing customer IDs and inventory SKUs) so the LLM links to existing records.
                </p>
                <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
{`// Response Output:
{
  "success": true,
  "fallback": false,
  "provider": "Gemini 3.8 Flash",
  "data": {
    "type": "sale" | "expense" | "baki_add" | "baki_payment" | "restock",
    "matchedCustomerId": "baki-1" | null,
    "customerName": "Rahim Mia",
    "matchedItemId": "inv-1" | null,
    "itemName": "Miniket Rice (50kg Bag)",
    "quantity": 5,
    "unit": "kg",
    "amount": 400,
    "note": "Sold 5 kg Miniket Rice for 400 Taka"
  }
}`}
                </div>
              </div>

              {/* Action 2: shop_qa */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800">2. Action: shop_qa ("Ask Your Shop")</h4>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Hybrid Synthesis</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Answers operational queries using pruned factual store data retrieved via BM25 hybrid matching.
                </p>
                <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
{`// Response Output:
{
  "success": true,
  "provider": "Qwen 3.8 27B (Groq)",
  "data": {
    "answer": "Karim Store has the highest outstanding balance of ৳ 3,400.",
    "answerBn": "সবচেয়ে বেশি বাকি আছে করিম স্টোরের, মোট ৳ ৩,৪০০।",
    "keyMetric": "৳ ৩,৪০০ বাকি (করিম স্টোর)",
    "intent": "baki"
  }
}`}
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION J: AI LAYER & MULTI-MODEL ROUTING */}
          {/* ==================================================================== */}
          <section id="ai-layer" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Intelligence Architecture
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              AI Layer: Multi-Model Routing & 3-Tier Resilience
            </h2>
            <p className="text-xs text-slate-500">
              How Dokan Helper routes workloads to achieve sub-second execution, low inference costs, and guaranteed uptime.
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="py-2.5 px-3">Route Action</th>
                    <th className="py-2.5 px-3">Primary Provider</th>
                    <th className="py-2.5 px-3">Failover Provider</th>
                    <th className="py-2.5 px-3">Tertiary Offline Fallback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold">parse_command</td>
                    <td className="py-2.5 px-3 text-brand-700 font-semibold">Gemini 3.8 / 2.5 Flash</td>
                    <td className="py-2.5 px-3 text-purple-700">Groq Qwen 3.8 27B</td>
                    <td className="py-2.5 px-3 text-slate-500">Client regex parser</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold">shop_qa</td>
                    <td className="py-2.5 px-3 text-purple-700 font-semibold">Groq Qwen 3.8 27B / Llama 3.3</td>
                    <td className="py-2.5 px-3 text-brand-700">Gemini 3.8 Flash</td>
                    <td className="py-2.5 px-3 text-slate-500">Local BM25 rule synthesis</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold">scan_receipt</td>
                    <td className="py-2.5 px-3 text-brand-700 font-semibold">Gemini 3.8 Flash Vision</td>
                    <td className="py-2.5 px-3 text-slate-500">Preset OCR Engine</td>
                    <td className="py-2.5 px-3 text-slate-500">Manual review modal</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold">generate_insights</td>
                    <td className="py-2.5 px-3 text-purple-700 font-semibold">Groq Qwen 3.8 (Cached)</td>
                    <td className="py-2.5 px-3 text-brand-700">Gemini 3.8 Flash</td>
                    <td className="py-2.5 px-3 text-slate-500">Deterministic rule alerts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION K: DATA LAYER & PRIVACY */}
          {/* ==================================================================== */}
          <section id="data-layer" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Data & Storage
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Data Layer, Privacy & UTF-8 BOM CSV Export
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-brand-600" />
                  <span>Local-First Persistence Model</span>
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  Store records are stored directly in browser <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">localStorage</code>. 
                  Even without an internet connection or backend database, merchants can record transactions, adjust inventory, and review ledgers.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Bengali Script UTF-8 BOM Handling</span>
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  Standard CSV files often display corrupted symbols (mojibake) when opened in Microsoft Excel with Bengali script. 
                  Dokan Helper prefixes all exported CSV files with the UTF-8 Byte Order Mark (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">\uFEFF</code>), ensuring pristine Bengali text rendering in Excel and Google Sheets.
                </p>
              </div>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION L: PRODUCT ROADMAP */}
          {/* ==================================================================== */}
          <section id="roadmap" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Milestone Roadmap
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Development Roadmap (Phase 1, 2, 3)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-emerald-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Phase 1 (MVP)</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Completed</span>
                </div>
                <h4 className="font-bold text-xs text-slate-800">Voice-First Standalone</h4>
                <ul className="text-[11px] text-slate-500 space-y-1">
                  <li>• Continuous Web Speech audio capture</li>
                  <li>• Multi-model serverless proxy</li>
                  <li>• Zod runtime schema validation</li>
                  <li>• HITL modal & UTF-8 BOM CSV export</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-blue-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Phase 2</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Q3 2026</span>
                </div>
                <h4 className="font-bold text-xs text-slate-800">Cloud Sync & Messaging</h4>
                <ul className="text-[11px] text-slate-500 space-y-1">
                  <li>• Supabase PostgreSQL multi-device sync</li>
                  <li>• Phone OTP merchant authentication</li>
                  <li>• WhatsApp Cloud API Baki reminders</li>
                  <li>• Wholesaler receipt OCR auto-entry</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-purple-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-700 uppercase">Phase 3</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Q4 2026</span>
                </div>
                <h4 className="font-bold text-xs text-slate-800">Fintech & Demand Hub</h4>
                <ul className="text-[11px] text-slate-500 space-y-1">
                  <li>• bKash / Nagad QR payment webhooks</li>
                  <li>• FMCG distributor demand forecasting</li>
                  <li>• Merchant credit score for micro-loans</li>
                  <li>• React Native Android mobile app</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION M: PERFORMANCE & SCALABILITY */}
          {/* ==================================================================== */}
          <section id="scalability" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              System Performance
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Performance, Latency & Cost Optimization
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">State-Hash Caching</div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Business recommendations are hashed against sales/expense snapshots. Consecutive requests with identical metrics return from in-memory cache in <strong>&lt; 5 ms</strong> without API calls.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">Compact Context Trimming</div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Only entity IDs, item names, and current balances are transmitted to LLM prompts, keeping token sizes under 450 tokens per transaction.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">Serverless Auto-Scaling</div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Vercel edge functions scale horizontally to thousands of concurrent requests across Bangladesh without server maintenance or idle instance costs.
                </p>
              </div>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION N: SECURITY & GUARDRAILS */}
          {/* ==================================================================== */}
          <section id="security" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Security Architecture
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Security, Guardrails & Financial Integrity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-brand-600" />
                  <span>Zero Client API Exposure</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Neither <code className="text-slate-800 font-bold">GEMINI_API_KEY</code> nor <code className="text-slate-800 font-bold">GROQ_API_KEY</code> are included in client bundles. Keys are read strictly on the server-side via Node environment variables.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Human-in-the-Loop Financial Barrier</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Financial numbers are never mutated blindly by autonomous agents. Every parsed entry is rendered in an editable confirmation card for merchant verification.
                </p>
              </div>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION O: CHANGELOG */}
          {/* ==================================================================== */}
          <section id="changelog" className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass border border-slate-200/80 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Release Log
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Changelog & Version History
            </h2>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-brand-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="text-brand-700">v1.3 — Global Standard YC Pitch Deck & /docs Module</span>
                  <span className="text-[10px] text-slate-400">Current Release</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Integrated full 12-slide YC Pitch Deck, Team "Straw Hat" roster with real DIU founders, live app data telemetry sync, passcode-protected Admin Panel (PIN: 2026), instant Markdown/PDF export, and clean SPA route support.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>v1.2 — Multi-Model Router & Zod Guardrails</span>
                  <span className="text-[10px] text-slate-400">Previous</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Added Gemini 3.8/2.5 Flash + Groq Qwen 3.8 27B / Llama 3.3 failover routing, Zod runtime sanitization, "Ask Your Shop" hybrid Q&A, and 1-click UTF-8 BOM CSV export.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>v1.1 — Vercel Serverless Proxy Architecture</span>
                  <span className="text-[10px] text-slate-400">Legacy</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Secured API keys on the server side via <code className="text-slate-800">/api/gemini</code>, eliminating all client bundle key leaks.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>v1.0 — Core Voice Recording & Dokan Prototype</span>
                  <span className="text-[10px] text-slate-400">Initial MVP</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Initial prototype with continuous Web Speech audio, Bengali numeral normalizer, and realistic local store demo data.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Admin Unlock Modal (Accessible anytime from top button) */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-600" />
                <span>Admin Panel Access</span>
              </h3>
              <button 
                onClick={() => { setIsAdminModalOpen(false); setPinError(''); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter demo passcode to configure visibility, schedule windows, and edit team rosters.
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <div>
                <input
                  type="password"
                  placeholder="Enter PIN (Demo: 2026)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-500 font-mono tracking-widest text-center"
                  autoFocus
                />
                {pinError && <div className="text-[11px] text-coral-600 mt-1">{pinError}</div>}
                <div className="text-[10px] text-slate-400 mt-2 text-center">
                  💡 Hint: Demo Admin Passcode is <code className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-800">2026</code>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsAdminModalOpen(false); setPinError(''); }}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-xs"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
