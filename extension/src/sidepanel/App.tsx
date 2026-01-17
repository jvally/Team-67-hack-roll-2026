import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

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

export default function App() {
  const [panelState, setPanelState] = useState<PanelState>(defaultState);

  const analysis = panelState.analysis;
  const market = panelState.market;
  const isBuy = analysis?.action === "BUY";
  const vibeColor = analysis?.vibe === "MOONING" ? "bg-neon-green" : "bg-neon-red";

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
    chrome.runtime?.sendMessage({ type: "STONK_MANUAL_REFRESH" });
  };

  // Demo mode for testing without extension context
  const runDemo = async () => {
    setPanelState((prev) => ({ ...prev, status: "loading" }));
    try {
      const res = await fetch(`${API_BASE}/analyze/demo`);
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

        {/* Loading State */}
        {panelState.status === "loading" && (
          <section className="rounded-3xl border border-black/10 bg-white/70 p-8 shadow-xl shadow-black/10 text-center">
            <div className="animate-pulse">
              <p className="text-lg font-semibold text-ink">Finding the alpha...</p>
              <p className="text-sm text-slate-500 mt-2">Analyzing {panelState.sourceTitle}</p>
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
      </div>
    </div>
  );
}
