import { useEffect, useState } from "react";

declare global {
  interface Window {
    updateFromResult: (ticker: string, price: number) => void;
  }
}

const API_BASE = "http://127.0.0.1:8000";

// Price Chart Component
type PricePoint = { timestamp: string; price: number };

function PriceChart({ data, color }: { data: PricePoint[]; color: string }) {
  if (!data || data.length === 0) return null;

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const width = 100;
  const height = 100;
  const padding = 5;

  // Generate SVG path points
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.price - minPrice) / priceRange) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(" ");

  // Create area path for gradient fill
  const areaPath = `M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`;

  const gradientId = `gradient-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />

      {/* Current price dot */}
      {data.length > 0 && (
        <circle
          cx={width - padding}
          cy={height - padding - ((data[data.length - 1].price - minPrice) / priceRange) * (height - 2 * padding)}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
}

// Troll level labels
const TROLL_LABELS = [
  { min: 0, max: 20, label: "Serious", emoji: "🎩" },
  { min: 21, max: 40, label: "Balanced", emoji: "⚖️" },
  { min: 41, max: 60, label: "Gen Z", emoji: "🔥" },
  { min: 61, max: 80, label: "Schizo", emoji: "🧠" },
  { min: 81, max: 100, label: "Max Troll", emoji: "🤡" },
];

const getTrollLabel = (level: number) => {
  const match = TROLL_LABELS.find(t => level >= t.min && level <= t.max);
  return match || TROLL_LABELS[2];
};

type AnalysisResult = {
  ticker: string;
  asset_type: "stock" | "crypto";
  action: "BUY" | "SELL";
  confidence: number;
  key_insight: string;
  reasoning: string;
  vibe: "MOONING" | "COOKED";
  meme_caption: string;
};

type MarketData = {
  ticker: string;
  name: string;
  current_price: number;
  change_24h_percent: number;
  price_history: Array<{ timestamp: string; price: number }>;
};

type PanelState = {
  status: "idle" | "loading" | "success" | "error";
  analysis: AnalysisResult | null;
  market: MarketData | null;
  sourceTitle: string;
  sourceUrl: string;
  error: string | null;
};

const defaultState = (): PanelState => ({
  status: "idle",
  analysis: null,
  market: null,
  sourceTitle: "Open a webpage to start analyzing...",
  sourceUrl: "",
  error: null
});

// Portfolio Types
interface Holding {
  ticker: string;
  shares: number;
  avgPrice: number;
}
interface Trade {
  type: 'BUY' | 'SELL';
  ticker: string;
  shares: number;
  price: number;
  timestamp: string;
}

// Portfolio State Helpers
const LS_KEY = 'stonkgaze-portfolio-v1';
function loadPortfolio() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '') || {
      cash: 10000,
      holdings: [],
      trades: [],
    };
  } catch {
    return { cash: 10000, holdings: [], trades: [] };
  }
}
function savePortfolio(p: any) {
  localStorage.setItem(LS_KEY, JSON.stringify(p));
}

export default function App() {
  const [panelState, setPanelState] = useState<PanelState>(defaultState);
  const [trollLevel, setTrollLevel] = useState(50);

  const analysis = panelState.analysis;
  const market = panelState.market;
  const isBuy = analysis?.action === "BUY";
  const vibeColor = analysis?.vibe === "MOONING" ? "bg-neon-green" : "bg-neon-red";
  const trollLabelInfo = getTrollLabel(trollLevel);

  useEffect(() => {
    // Load saved troll level
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["trollLevel"], (result) => {
        if (result.trollLevel !== undefined) {
          setTrollLevel(result.trollLevel);
        }
      });
    }
  }, []);

  useEffect(() => {
    // Save troll level when changed
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ trollLevel });
    }
  }, [trollLevel]);

  // Portfolio State
  const [portfolio, setPortfolio] = useState(() => loadPortfolio());
  const [tradeTicker, setTradeTicker] = useState('');
  const [tradePrice, setTradePrice] = useState(0);
  const [tradeShares, setTradeShares] = useState(1);
  const [tradeType, setTradeType] = useState<'BUY'|'SELL'>('BUY');
  const [tradeError, setTradeError] = useState('');

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) {
      return;
    }

    const handler = (message: any) => {
      if (message?.type === "STONK_LOADING") {
        setPanelState((prev) => ({
          ...prev,
          status: "loading",
          sourceTitle: message.payload?.title || "Loading...",
          sourceUrl: message.payload?.url || "",
          error: null
        }));
      }

      if (message?.type === "STONK_RESULT") {
        setPanelState({
          status: "success",
          analysis: message.payload?.analysis || null,
          market: message.payload?.market_data || null,
          sourceTitle: message.payload?.sourceTitle || "",
          sourceUrl: message.payload?.sourceUrl || "",
          error: null
        });
      }

      if (message?.type === "STONK_ERROR") {
        setPanelState((prev) => ({
          ...prev,
          status: "error",
          error: message.payload?.error || "Something went wrong fr fr"
        }));
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const runVibeCheck = () => {
    setPanelState((prev) => ({ ...prev, status: "loading" }));
    chrome.runtime?.sendMessage({ type: "STONK_MANUAL_REFRESH", trollLevel });
  };

  // Demo mode for testing without extension context
  const runDemo = async () => {
    setPanelState((prev) => ({ ...prev, status: "loading" }));
    try {
      const res = await fetch(`${API_BASE}/analyze/demo?troll_level=${trollLevel}`);
      const data = await res.json();
      if (data.success) {
        setPanelState({
          status: "success",
          analysis: data.analysis,
          market: data.market_data,
          sourceTitle: "Demo: Singapore Weather News",
          sourceUrl: "",
          error: null
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setPanelState((prev) => ({
        ...prev,
        status: "error",
        error: err.message
      }));
    }
  };

  // Update trade panel from LLM result
  useEffect(() => {
    window.updateFromResult = (ticker: string, price: number) => {
      setTradeTicker(ticker);
      setTradePrice(price);
    };
    // If analysis result, auto-set
    if (analysis && market) {
      setTradeTicker(analysis.ticker);
      setTradePrice(market.current_price);
    }
  }, [analysis, market]);

  // Persist portfolio
  useEffect(() => { savePortfolio(portfolio); }, [portfolio]);

  // Portfolio calculations
  const holdingsValue = portfolio.holdings.reduce((sum: number, h: Holding) => sum + h.shares * (h.ticker === tradeTicker ? tradePrice : h.avgPrice), 0);
  const totalValue = portfolio.cash + holdingsValue;
  const owned = portfolio.holdings.find((h: Holding) => h.ticker === tradeTicker)?.shares || 0;
  const estCost = tradeShares * tradePrice;

  // Trade validation
  function canTrade() {
    if (!tradeTicker || tradePrice <= 0 || tradeShares <= 0) return false;
    if (tradeType === 'BUY' && estCost > portfolio.cash) return false;
    if (tradeType === 'SELL' && tradeShares > owned) return false;
    return true;
  }

  function doTrade() {
    setTradeError('');
    if (!canTrade()) {
      setTradeError(tradeType === 'BUY' ? 'Not enough cash' : 'Not enough shares');
      return;
    }
    let newCash = portfolio.cash;
    let newHoldings = [...portfolio.holdings];
    let newTrades = [...portfolio.trades];
    if (tradeType === 'BUY') {
      newCash -= estCost;
      const idx = newHoldings.findIndex(h => h.ticker === tradeTicker);
      if (idx >= 0) {
        // Update avg price
        const h = newHoldings[idx];
        const totalCost = h.avgPrice * h.shares + estCost;
        const totalShares = h.shares + tradeShares;
        newHoldings[idx] = { ...h, shares: totalShares, avgPrice: totalCost / totalShares };
      } else {
        newHoldings.push({ ticker: tradeTicker, shares: tradeShares, avgPrice: tradePrice });
      }
    } else {
      newCash += estCost;
      const idx = newHoldings.findIndex(h => h.ticker === tradeTicker);
      if (idx >= 0) {
        const h = newHoldings[idx];
        const left = h.shares - tradeShares;
        if (left > 0) newHoldings[idx] = { ...h, shares: left };
        else newHoldings.splice(idx, 1);
      }
    }
    newTrades.unshift({ type: tradeType, ticker: tradeTicker, shares: tradeShares, price: tradePrice, timestamp: new Date().toISOString() });
    setPortfolio({ cash: newCash, holdings: newHoldings, trades: newTrades });
  }

  return (
    <div className="panel-shell min-h-screen px-5 py-6">
      <div className="relative z-10 flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-600">
              StonkGaze
            </p>
            <h1 className="font-['Rubik_Mono_One'] text-2xl tracking-tight text-ink">
              The Schizo-Analysis
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-full bg-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-ink transition hover:-translate-y-0.5"
              onClick={runDemo}
            >
              Demo
            </button>
            <button
              className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
              onClick={runVibeCheck}
            >
              Vibe Check
            </button>
          </div>
        </header>

        {/* Troll Level Slider */}
        <section className="rounded-3xl border border-black/10 bg-white/70 p-4 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              🎚️ Analysis Mode
            </p>
            <span className="text-lg">
              {trollLabelInfo.emoji} {trollLabelInfo.label}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={trollLevel}
            onChange={(e) => setTrollLevel(Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                #3b82f6 0%, 
                #8b5cf6 25%, 
                #f59e0b 50%, 
                #ef4444 75%, 
                #ec4899 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>🎩 Serious</span>
            <span>🤡 Unhinged</span>
          </div>
        </section>

        {/* Loading State */}
        {panelState.status === "loading" && (
          <section className="rounded-3xl border border-black/10 bg-white/70 p-8 shadow-xl shadow-black/10 text-center">
            <div className="animate-pulse">
              <p className="text-lg font-semibold text-ink">Finding the alpha...</p>
              <p className="text-sm text-slate-500 mt-2">Analyzing {panelState.sourceTitle}</p>
              <p className="text-xs text-slate-400 mt-1">Mode: {trollLabelInfo.emoji} {trollLabelInfo.label}</p>
            </div>
          </section>
        )}

        {/* Error State */}
        {panelState.status === "error" && (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-xl">
            <p className="text-sm font-semibold text-red-600">⚠️ {panelState.error}</p>
            <p className="text-xs text-red-500 mt-2">Make sure the backend is running at {API_BASE}</p>
          </section>
        )}

        {/* Idle State */}
        {panelState.status === "idle" && (
          <section className="rounded-3xl border border-black/10 bg-white/70 p-8 shadow-xl shadow-black/10 text-center">
            <p className="text-lg font-semibold text-ink">👀 Ready to analyze</p>
            <p className="text-sm text-slate-500 mt-2">
              Navigate to any webpage or click "Demo" to test
            </p>
          </section>
        )}

        {/* Success State - Results */}
        {panelState.status === "success" && analysis && (
          <>
            {/* Ticker Display */}
            <section className="rounded-3xl border border-black/10 bg-white/70 p-4 shadow-xl shadow-black/10">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${isBuy ? "bg-neon-green text-black" : "bg-neon-red text-white"
                    }`}>
                    {isBuy ? "🚀 Strong Buy" : "📉 Massive Sell"}
                  </span>
                  <h2 className="ticker-flash font-['Rubik_Mono_One'] text-4xl text-ink mt-2">
                    ${analysis.ticker}
                  </h2>
                  <p className="text-sm text-slate-500">{market?.name || analysis.asset_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Confidence
                  </p>
                  <p className="text-2xl font-bold text-ink">{analysis.confidence}%</p>
                  {market && (
                    <p className={`text-sm font-semibold ${market.change_24h_percent >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                      {market.change_24h_percent >= 0 ? "+" : ""}{market.change_24h_percent?.toFixed(2)}%
                    </p>
                  )}
                </div>
              </div>

              {/* Vibe Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500">
                  <span>Vibe Check</span>
                  <span>{analysis.vibe === "MOONING" ? "🚀 Mooning" : "💀 Cooked"}</span>
                </div>
                <div className="mt-2 h-3 w-full rounded-full bg-black/10">
                  <div
                    className={`h-3 rounded-full ${vibeColor}`}
                    style={{ width: `${analysis.confidence}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Key Insight */}
            <section className="rounded-3xl border border-neon-green/30 bg-gradient-to-br from-neon-green/10 to-purple-500/10 p-4 shadow-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">🔗 Key Insight</p>
              <p className="mt-2 text-lg font-semibold text-ink">{analysis.key_insight}</p>
            </section>

            {/* Price Chart */}
            {market?.price_history && market.price_history.length > 0 && (
              <section className="rounded-3xl border border-black/10 bg-white/80 p-4 shadow-lg shadow-black/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">📈 7-Day Price Action</p>
                  <span className={`text-sm font-bold ${market.change_24h_percent >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {market.change_24h_percent >= 0 ? "▲" : "▼"} {Math.abs(market.change_24h_percent).toFixed(2)}%
                  </span>
                </div>
                <div className="h-32 w-full">
                  <PriceChart
                    data={market.price_history}
                    color={isBuy ? "#00ff88" : "#ff3366"}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>7 days ago</span>
                  <span>Now</span>
                </div>
              </section>
            )}

            {/* Alpha Drop */}
            <section className="rounded-3xl border border-black/10 bg-white/80 p-4 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">💡 Alpha Drop</p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Source: {panelState.sourceTitle}
              </p>
              <p className="mt-3 text-base text-ink leading-relaxed">{analysis.reasoning}</p>
              {panelState.sourceUrl && (
                <a
                  className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-ink/60 hover:text-ink"
                  href={panelState.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Source →
                </a>
              )}
            </section>

            {/* Market Data */}
            {market && (
              <section className="rounded-3xl border border-black/10 bg-white/80 p-4 shadow-lg shadow-black/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">📊 Market Data</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500">Price</p>
                    <p className="text-lg font-bold text-ink">${market.current_price?.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500">24h Change</p>
                    <p className={`text-lg font-bold ${market.change_24h_percent >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                      {market.change_24h_percent >= 0 ? "+" : ""}{market.change_24h_percent?.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Meme Box */}
            <section className="rounded-3xl border border-black/10 bg-white/80 p-4 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">🎭 Meme Box</p>
              <div className="mt-3 rounded-2xl border border-dashed border-purple-300 bg-purple-50 p-6 text-center">
                <p className="text-sm font-semibold text-ink italic">"{analysis.meme_caption}"</p>
              </div>
            </section>
          </>
        )}

        {/* Portfolio Section */}
        <section className="mt-8 rounded-3xl border border-yellow-300 bg-yellow-50 p-4 shadow-xl">
          <h2 className="text-lg font-bold text-yellow-900 mb-2">💼 Paper Trading Portfolio</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="bg-white rounded-xl p-3 text-center min-w-[120px]">
              <p className="text-xs text-slate-500">Cash</p>
              <p className="text-lg font-bold text-green-700">${portfolio.cash.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center min-w-[120px]">
              <p className="text-xs text-slate-500">Holdings Value</p>
              <p className="text-lg font-bold text-blue-700">${holdingsValue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center min-w-[120px]">
              <p className="text-xs text-slate-500">Total Value</p>
              <p className="text-lg font-bold text-purple-700">${totalValue.toLocaleString()}</p>
            </div>
          </div>
          {/* Trade Panel */}
          <div className="mb-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-slate-500">Symbol</label>
              <input className="border rounded px-2 py-1 w-24" value={tradeTicker} onChange={e => setTradeTicker(e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Price</label>
              <input className="border rounded px-2 py-1 w-24" type="number" value={tradePrice} onChange={e => setTradePrice(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Shares</label>
              <input className="border rounded px-2 py-1 w-20" type="number" min={1} value={tradeShares} onChange={e => setTradeShares(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Type</label>
              <select className="border rounded px-2 py-1 w-20" value={tradeType} onChange={e => setTradeType(e.target.value as any)}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500">Est. Cost</label>
              <div className="font-bold">${estCost.toLocaleString()}</div>
            </div>
            <div>
              <label className="block text-xs text-slate-500">Owned</label>
              <div className="font-bold">{owned}</div>
            </div>
            <button className={`ml-2 px-4 py-2 rounded bg-yellow-400 text-black font-bold shadow ${canTrade() ? 'hover:bg-yellow-500' : 'opacity-50 cursor-not-allowed'}`} disabled={!canTrade()} onClick={doTrade}>
              {tradeType}
            </button>
          </div>
          {tradeError && <div className="text-red-600 text-xs mb-2">{tradeError}</div>}
          {/* Holdings List */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-600 mb-1">Holdings</h3>
            {portfolio.holdings.length === 0 ? <div className="text-slate-400 text-xs">No holdings</div> : (
              <table className="w-full text-xs">
                <thead><tr><th className="text-left">Symbol</th><th>Shares</th><th>Avg Price</th></tr></thead>
                <tbody>
                  {portfolio.holdings.map((h: Holding) => (
                    <tr key={h.ticker}><td>{h.ticker}</td><td>{h.shares}</td><td>${h.avgPrice.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Trade History */}
          <div>
            <h3 className="text-xs font-bold text-slate-600 mb-1">Trade History</h3>
            {portfolio.trades.length === 0 ? <div className="text-slate-400 text-xs">No trades yet</div> : (
              <table className="w-full text-xs">
                <thead><tr><th>Time</th><th>Type</th><th>Symbol</th><th>Shares</th><th>Price</th></tr></thead>
                <tbody>
                  {portfolio.trades.slice(0, 10).map((t: Trade, i: number) => (
                    <tr key={i}><td>{new Date(t.timestamp).toLocaleString()}</td><td>{t.type}</td><td>{t.ticker}</td><td>{t.shares}</td><td>${t.price.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
