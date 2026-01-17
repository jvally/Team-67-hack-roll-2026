import { useEffect, useMemo, useState } from "react";

const tickers = ["$TSLA", "$AAPL", "$UBER", "$NVDA", "$ETH", "$DOGE"];
const vibeLabels = [
  { label: "Mooning", color: "bg-neon-green", text: "Neon Green" },
  { label: "Cooked", color: "bg-neon-red", text: "Neon Red" },
  { label: "Sideways", color: "bg-neon-cyan", text: "Neon Cyan" }
];
const memeCaptions = [
  "Me explaining why rain in London means Uber calls print.",
  "Never seen a chart this delulu and I love it.",
  "When the vibes are immaculate but the logic is cooked.",
  "I am not a financial advisor. I am a prophet."
];
const emojiPool = ["", "", "", "", "", ""];

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

type PanelState = {
  ticker: string;
  vibeIndex: number;
  meme: string;
  sourceTitle: string;
  sourceUrl: string;
  confidence: number;
};

const defaultState = (): PanelState => ({
  ticker: pick(tickers),
  vibeIndex: Math.floor(Math.random() * vibeLabels.length),
  meme: pick(memeCaptions),
  sourceTitle: "Scanning the web for vibes...",
  sourceUrl: "",
  confidence: 70 + Math.floor(Math.random() * 20)
});

export default function App() {
  const [panelState, setPanelState] = useState<PanelState>(defaultState);
  const [trend] = useState([22, 30, 26, 38, 42, 39, 55, 47, 62]);

  const vibe = vibeLabels[panelState.vibeIndex];

  const emojiSpots = useMemo(
    () =>
      trend.map((value, index) => ({
        emoji: pick(emojiPool),
        left: 10 + index * 10,
        top: 70 - value * 0.6
      })),
    [trend]
  );

  const runVibeCheck = () => {
    setPanelState(defaultState());
  };

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) {
      return;
    }
    const handler = (message: any) => {
      if (message?.type !== "STONK_SOURCE") return;
      setPanelState((prev) => ({
        ...prev,
        sourceTitle: message.payload?.title || prev.sourceTitle,
        sourceUrl: message.payload?.url || prev.sourceUrl
      }));
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  return (
    <div className="panel-shell min-h-screen px-5 py-6">
      <div className="relative z-10 flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-600">
              StonkGaze
            </p>
            <h1 className="font-['Rubik_Mono_One'] text-2xl tracking-tight text-ink">
              The Schizo-Analysis
            </h1>
          </div>
          <button
            className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
            onClick={runVibeCheck}
          >
            Vibe Check
          </button>
        </header>

        <section className="rounded-3xl border border-black/10 bg-white/70 p-4 shadow-xl shadow-black/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                The Ticker
              </p>
              <h2 className="ticker-flash font-['Rubik_Mono_One'] text-4xl text-ink">
                {panelState.ticker}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Confidence
              </p>
              <p className="text-2xl font-bold text-ink">{panelState.confidence}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500">
              <span>Vibe Check</span>
              <span>{vibe.label}</span>
            </div>
            <div className="mt-2 h-3 w-full rounded-full bg-black/10">
              <div
                className={`h-3 rounded-full ${vibe.color}`}
                style={{ width: `${panelState.confidence}%` }}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white/70 p-4 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                24H Price Action
              </p>
              <h3 className="text-lg font-semibold text-ink">Totally Legit Chart</h3>
            </div>
            <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink">
              {vibe.text}
            </span>
          </div>
          <div className="chart-grid relative mt-4 h-40 rounded-2xl border border-black/10 bg-white/60 p-3">
            <svg viewBox="0 0 100 60" className="h-full w-full">
              <polyline
                fill="none"
                stroke="#0c0c14"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points="0,48 12,38 24,45 36,30 48,25 60,28 72,16 84,22 100,8"
              />
            </svg>
            {emojiSpots.map((spot, index) => (
              <span
                key={`${spot.emoji}-${index}`}
                className="floaty absolute text-lg"
                style={{ left: `${spot.left}%`, top: `${spot.top}%` }}
              >
                {spot.emoji}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-3xl border border-black/10 bg-white/80 p-4 shadow-lg shadow-black/10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Alpha Drop</p>
            <p className="mt-2 text-sm font-medium text-ink">
              Source: {panelState.sourceTitle}
            </p>
            <p className="mt-3 text-base text-ink">
              The market is absolutely delulu right now. If this page is talking about
              weather, vibes, or anything remotely soggy, it is bullish for rideshares.
              Secure the bag.
            </p>
            {panelState.sourceUrl ? (
              <a
                className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-ink/60"
                href={panelState.sourceUrl}
              >
                {panelState.sourceUrl}
              </a>
            ) : null}
          </div>
          <div className="rounded-3xl border border-black/10 bg-white/80 p-4 shadow-lg shadow-black/10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Meme Box</p>
            <div className="mt-3 rounded-2xl border border-dashed border-black/20 bg-white/70 p-6 text-center">
              <p className="text-sm font-semibold text-ink">
                {panelState.meme}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                insert stonk meme here
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
