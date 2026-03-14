"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchLatestPrice,
  startBot,
  stopBot,
  getBotStatus,
  fetchTradeHistory,
  fetchPortfolio,
  executeTrade,
} from "@/lib/api";
import { usePriceSocket } from "@/lib/usePriceSocket";

/* ──────────────────────────────────────────
   TYPES
   ────────────────────────────────────────── */
type Page =
  | "dashboard"
  | "market"
  | "strategy"
  | "bot"
  | "portfolio"
  | "history"
  | "backtest"
  | "settings";

interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface Trade {
  id: string;
  symbol: string;
  side: "Buy" | "Sell";
  entry: number;
  exit: number;
  qty: number;
  pnl: number;
  time: string;
}

interface ApiTrade {
  trade_id: string;
  symbol: string;
  side: string;
  entry_price: number;
  quantity: number;
  profit_loss: number | null;
  timestamp: string;
}

/* ──────────────────────────────────────────
   MOCK DATA
   ────────────────────────────────────────── */
function generateCandles(n: number): Candle[] {
  const candles: Candle[] = [];
  let price = 67450;
  for (let i = 0; i < n; i++) {
    const open = price;
    const change = (Math.random() - 0.48) * 600;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 300;
    const low = Math.min(open, close) - Math.random() * 300;
    const vol = 50 + Math.random() * 200;
    candles.push({ o: open, h: high, l: low, c: close, v: vol });
    price = close;
  }
  return candles;
}

const MOCK_CANDLES = generateCandles(60);

const MOCK_TRADES: Trade[] = [
  { id: "T-001", symbol: "BTCUSDT", side: "Buy", entry: 67320.5, exit: 67890.2, qty: 0.15, pnl: 85.46, time: "2026-03-10 14:32" },
  { id: "T-002", symbol: "ETHUSDT", side: "Sell", entry: 3842.1, exit: 3785.6, qty: 2.5, pnl: 141.25, time: "2026-03-10 13:18" },
  { id: "T-003", symbol: "SOLUSDT", side: "Buy", entry: 142.35, exit: 138.72, qty: 25, pnl: -90.75, time: "2026-03-10 12:05" },
  { id: "T-004", symbol: "BTCUSDT", side: "Sell", entry: 67950.0, exit: 67440.3, qty: 0.1, pnl: 50.97, time: "2026-03-10 11:42" },
  { id: "T-005", symbol: "ETHUSDT", side: "Buy", entry: 3790.2, exit: 3856.8, qty: 3.0, pnl: 199.80, time: "2026-03-10 10:28" },
  { id: "T-006", symbol: "BTCUSDT", side: "Buy", entry: 66890.0, exit: 67120.5, qty: 0.2, pnl: 46.10, time: "2026-03-10 09:15" },
  { id: "T-007", symbol: "SOLUSDT", side: "Sell", entry: 145.80, exit: 143.12, qty: 30, pnl: 80.40, time: "2026-03-10 08:50" },
  { id: "T-008", symbol: "ETHUSDT", side: "Sell", entry: 3870.5, exit: 3900.2, qty: 1.5, pnl: -44.55, time: "2026-03-09 22:30" },
];

const NOTIFICATIONS = [
  { type: "trade" as const, title: "Trade Executed — BTC Long +$85.46", time: "2 min ago" },
  { type: "bot" as const, title: "Bot Started — MA Crossover Strategy", time: "15 min ago" },
  { type: "alert" as const, title: "RSI Strategy triggered on ETH", time: "32 min ago" },
  { type: "error" as const, title: "API rate limit warning", time: "1 hr ago" },
  { type: "trade" as const, title: "Stop Loss hit on SOL position", time: "2 hr ago" },
];

/* ──────────────────────────────────────────
   CANDLESTICK CHART COMPONENT
   ────────────────────────────────────────── */
function CandlestickChart({ candles }: { candles: Candle[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const chartH = H * 0.72;
    const volH = H * 0.2;
    const volTop = chartH + H * 0.04;
    const pad = 6;

    ctx.clearRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad + (chartH - pad * 2) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const allH = candles.map((c) => c.h);
    const allL = candles.map((c) => c.l);
    const maxP = Math.max(...allH);
    const minP = Math.min(...allL);
    const priceRange = maxP - minP || 1;
    const maxVol = Math.max(...candles.map((c) => c.v)) || 1;

    const candleW = (W - 20) / candles.length;
    const bodyW = Math.max(candleW * 0.6, 3);

    candles.forEach((c, i) => {
      const x = 10 + i * candleW + candleW / 2;
      const green = c.c >= c.o;
      const color = green ? "#00e676" : "#ff3d57";

      // wick
      const wickTop = pad + ((maxP - c.h) / priceRange) * (chartH - pad * 2);
      const wickBot = pad + ((maxP - c.l) / priceRange) * (chartH - pad * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, wickTop);
      ctx.lineTo(x, wickBot);
      ctx.stroke();

      // body
      const openY = pad + ((maxP - c.o) / priceRange) * (chartH - pad * 2);
      const closeY = pad + ((maxP - c.c) / priceRange) * (chartH - pad * 2);
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(Math.abs(openY - closeY), 1);
      ctx.fillStyle = color;
      ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH);

      // volume
      const vH = (c.v / maxVol) * volH;
      ctx.fillStyle = green ? "rgba(0,230,118,0.25)" : "rgba(255,61,87,0.25)";
      ctx.fillRect(x - bodyW / 2, volTop + volH - vH, bodyW, vH);
    });

    // price labels
    ctx.fillStyle = "#7a8599";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const p = maxP - (priceRange * i) / 4;
      const y = pad + (chartH - pad * 2) * (i / 4);
      ctx.fillText(p.toFixed(1), W - 4, y + 4);
    }

    // crosshair guide line (current price)
    const lastC = candles[candles.length - 1];
    const lastY = pad + ((maxP - lastC.c) / priceRange) * (chartH - pad * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = lastC.c >= lastC.o ? "rgba(0,230,118,0.4)" : "rgba(255,61,87,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, lastY);
    ctx.lineTo(W, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    // current price label
    const priceColor = lastC.c >= lastC.o ? "#00e676" : "#ff3d57";
    ctx.fillStyle = priceColor;
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText(lastC.c.toFixed(1), W - 4, lastY - 6);
  }, [candles]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return <canvas ref={canvasRef} className="chart-canvas" />;
}

/* ──────────────────────────────────────────
   EQUITY CURVE CHART
   ────────────────────────────────────────── */
function EquityChart({ data, color = "#00d2ff" }: { data: number[]; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = 10;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    ctx.clearRect(0, 0, W, H);

    // area fill
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, color + "30");
    gradient.addColorStop(1, color + "02");

    ctx.beginPath();
    ctx.moveTo(pad, H - pad);
    data.forEach((v, i) => {
      const x = pad + (i / (data.length - 1)) * (W - pad * 2);
      const y = pad + ((max - v) / range) * (H - pad * 2);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(W - pad, H - pad);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // line
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad + (i / (data.length - 1)) * (W - pad * 2);
      const y = pad + ((max - v) / range) * (H - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [data, color]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return <canvas ref={canvasRef} className="chart-canvas" style={{ height: "100%" }} />;
}

/* ──────────────────────────────────────────
   PIE CHART COMPONENT
   ────────────────────────────────────────── */
function PieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 140 * dpr;
    canvas.height = 140 * dpr;
    ctx.scale(dpr, dpr);

    const size = 140;
    const cx = size / 2;
    const cy = size / 2;
    const r = 56;
    const innerR = 36;
    const total = slices.reduce((s, sl) => s + sl.value, 0);

    let angle = -Math.PI / 2;
    slices.forEach((sl) => {
      const sliceAngle = (sl.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = sl.color;
      ctx.fill();
      angle += sliceAngle;
    });

    // inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = "#141926";
    ctx.fill();
  }, [slices]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="pie-chart-container">
      <canvas ref={canvasRef} style={{ width: 140, height: 140 }} />
      <div className="pie-legend">
        {slices.map((sl) => (
          <div key={sl.label} className="pie-legend-item">
            <span className="pie-legend-dot" style={{ background: sl.color }} />
            <span>{sl.label} ({sl.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   MAIN APP COMPONENT
   ────────────────────────────────────────── */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [botRunning, setBotRunning] = useState(false);
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [selectedTf, setSelectedTf] = useState("15m");
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedStrategy, setSelectedStrategy] = useState("ma_cross");
  const [backtestRun, setBacktestRun] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [apiTrades, setApiTrades] = useState<ApiTrade[]>([]);
  const [portfolio, setPortfolio] = useState<any | null>(null);
  const [botStatus, setBotStatus] = useState<{
    running: boolean;
    last_signal: string | null;
    last_price: number | null;
  } | null>(null);

  const liveSocketPrice = usePriceSocket(selectedSymbol);

  // Load live market price (REST) and poll
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchLatestPrice(selectedSymbol);
        if (!cancelled) setLatestPrice(data.price);
      } catch {
        // ignore
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedSymbol]);

  // Load bot status periodically
  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const s = await getBotStatus();
        if (!cancelled) {
          setBotStatus(s);
          setBotRunning(s.running);
        }
      } catch {
        // ignore
      }
    }
    loadStatus();
    const id = setInterval(loadStatus, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Load trade history
  useEffect(() => {
    async function loadHistory() {
      try {
        const h = await fetchTradeHistory();
        setApiTrades(h);
      } catch {
        // ignore
      }
    }
    loadHistory();
  }, []);

  // Load portfolio
  useEffect(() => {
    async function loadPortfolio() {
      try {
        const p = await fetchPortfolio();
        setPortfolio(p);
      } catch {
        // ignore
      }
    }
    loadPortfolio();
  }, []);

  // ─── LOGIN SCREEN ───
  if (!isLoggedIn) {
    return (
      <div className="login-backdrop">
        <div className="login-card">
          <div className="login-logo">
            <h1>DeltaAlgo Trader</h1>
            <p>Algorithmic Crypto Trading Platform</p>
          </div>

          <div className="form-group">
            <label>Email / Username</label>
            <input className="form-input" type="text" placeholder="trader@deltaalgo.io" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" placeholder="••••••••••" />
          </div>

          <div className="form-divider">API CONFIGURATION</div>

          <div className="form-group">
            <label>Delta Exchange API Key</label>
            <input className="form-input mono" type="text" placeholder="Enter your API key" />
          </div>
          <div className="form-group">
            <label>API Secret</label>
            <input className="form-input mono" type="password" placeholder="Enter your API secret" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <button className="btn btn-outline" onClick={() => setIsLoggedIn(true)}>
              🔗 Connect API
            </button>
            <button className="btn btn-primary" onClick={() => setIsLoggedIn(true)}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── NAV ITEMS ───
  const NAV_ITEMS: { key: Page; icon: string; label: string }[] = [
    { key: "dashboard", icon: "📊", label: "Dashboard" },
    { key: "market", icon: "📈", label: "Live Market" },
    { key: "strategy", icon: "⚙️", label: "Strategy Builder" },
    { key: "bot", icon: "🤖", label: "Bot Control" },
    { key: "portfolio", icon: "💼", label: "Portfolio" },
    { key: "history", icon: "📋", label: "Trade History" },
    { key: "backtest", icon: "🧪", label: "Backtesting" },
    { key: "settings", icon: "⚡", label: "Settings" },
  ];

  const timeframes = ["1m", "5m", "15m", "1h", "4h", "1D"];

  const handleStartBot = async () => {
    await startBot();
    const s = await getBotStatus();
    setBotStatus(s);
    setBotRunning(s.running);
  };

  const handleStopBot = async () => {
    await stopBot();
    const s = await getBotStatus();
    setBotStatus(s);
    setBotRunning(s.running);
  };

  const handleManualTrade = async () => {
    try {
      await executeTrade(tradeSide === "buy" ? "BUY" : "SELL", selectedSymbol);
      const h = await fetchTradeHistory();
      setApiTrades(h);
    } catch {
      // ignore for now
    }
  };

  // ─── FILTERED TRADES ───
  const filteredTrades = MOCK_TRADES.filter((t) => {
    const matchSearch =
      !searchQuery ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      historyFilter === "all" ||
      (historyFilter === "buy" && t.side === "Buy") ||
      (historyFilter === "sell" && t.side === "Sell");
    return matchSearch && matchFilter;
  });

  // ─── EQUITY DATA ───
  const equityData = [10000, 10250, 10180, 10520, 10400, 10780, 10650, 10930, 11200, 11050, 11380, 11520, 11785, 11640, 12050, 12200, 12450, 12380, 12680, 12920];
  const backtestEquity = [10000, 10120, 10350, 10280, 10560, 10800, 10650, 10920, 11200, 11050, 11420, 11680, 11540, 11890, 12100, 12350, 12200, 12580, 12890, 13200];

  // Derive primary account balance from live portfolio (if available)
  const primaryBalance: number | null =
    (portfolio?.balances?.result?.[0]?.available_balance ??
      portfolio?.balances?.result?.[0]?.balance ??
      null) ?? null;

  return (
    <div className="app-layout">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>DeltaAlgo</h2>
          <span>TRADING TERMINAL</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? "active" : ""}`}
              onClick={() => setCurrentPage(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => setIsLoggedIn(false)}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="main-content">
        {/* ─── TOP BAR ─── */}
        <header className="topbar">
          <div className="topbar-prices">
            <div className="price-ticker">
              <span className="symbol">BTC</span>
              <span className="price" style={{ color: "var(--trade-green)" }}>
                $
                {(
                  liveSocketPrice ??
                  latestPrice ??
                  67842.5
                ).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="change up">+2.34%</span>
            </div>
            <div className="price-ticker">
              <span className="symbol">ETH</span>
              <span className="price" style={{ color: "var(--trade-green)" }}>$3,847.20</span>
              <span className="change up">+1.82%</span>
            </div>
            <div className="price-ticker">
              <span className="symbol">SOL</span>
              <span className="price" style={{ color: "var(--trade-red)" }}>$142.85</span>
              <span className="change down">-0.65%</span>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-balance">
              <span className="label">Balance</span>
              <span className="value">
                {primaryBalance !== null
                  ? `$${primaryBalance.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}`
                  : "$124,582.40"}
              </span>
            </div>
            <div
              className={`bot-status ${botRunning ? "running" : "stopped"}`}
              onClick={botRunning ? handleStopBot : handleStartBot}
              style={{ cursor: "pointer" }}
            >
              <span className="dot" />
              {botRunning ? "Bot Running" : "Bot Stopped"}
            </div>
            <button className="topbar-icon" onClick={() => setShowNotifications(!showNotifications)}>
              🔔
              <span className="badge" />
            </button>
            <div className="user-avatar">AP</div>
          </div>
        </header>

        {/* Notifications */}
        {showNotifications && (
          <div className="notifications-panel">
            <div className="notification-header">
              <h3>Notifications</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowNotifications(false)}>
                ✕
              </button>
            </div>
            {NOTIFICATIONS.map((n, i) => (
              <div key={i} className="notification-item">
                <div className={`notification-icon notif-${n.type}`}>
                  {n.type === "trade" ? "💰" : n.type === "bot" ? "🤖" : n.type === "alert" ? "⚡" : "⚠️"}
                </div>
                <div className="notification-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-time">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── WORKSPACE ─── */}
        <div className="workspace">
          <div className="workspace-main">
            {/* ════════════ DASHBOARD ════════════ */}
            {(currentPage === "dashboard" || currentPage === "market") && (
              <>
                {/* Chart */}
                <div className="card">
                  <div className="chart-toolbar">
                    <select className="symbol-select" value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
                      <option value="BTCUSDT">BTCUSDT</option>
                      <option value="ETHUSDT">ETHUSDT</option>
                      <option value="SOLUSDT">SOLUSDT</option>
                    </select>
                    <div className="chart-toolbar-group">
                      {timeframes.map((tf) => (
                        <button key={tf} className={`tf-btn ${selectedTf === tf ? "active" : ""}`} onClick={() => setSelectedTf(tf)}>
                          {tf}
                        </button>
                      ))}
                    </div>
                    <div className="chart-toolbar-group">
                      <button className="tf-btn">📏 Measure</button>
                      <button className="tf-btn">📐 Trendline</button>
                      <button className="tf-btn">📊 Indicators</button>
                    </div>
                  </div>
                  <div className="chart-area">
                    <CandlestickChart candles={MOCK_CANDLES} />
                  </div>
                </div>

                {/* Strategy Builder + Trade Execution */}
                <div className="two-col">
                  {/* Strategy Builder */}
                  <div className="card">
                    <div className="card-header">
                      <h3><span className="icon">⚙️</span> Strategy Builder</h3>
                    </div>
                    <div className="card-body">
                      <div className="form-group">
                        <label>Strategy</label>
                        <select className="form-input" value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value)}>
                          <option value="ma_cross">Moving Average Crossover</option>
                          <option value="rsi">RSI Strategy</option>
                          <option value="macd">MACD Strategy</option>
                          <option value="ai">AI Prediction Strategy</option>
                        </select>
                      </div>
                      <div className="strategy-grid">
                        <div className="form-group">
                          <label>Short MA</label>
                          <input className="form-input mono" type="number" defaultValue="9" />
                        </div>
                        <div className="form-group">
                          <label>Long MA</label>
                          <input className="form-input mono" type="number" defaultValue="21" />
                        </div>
                        <div className="form-group">
                          <label>Stop Loss (%)</label>
                          <input className="form-input mono" type="number" defaultValue="2.5" />
                        </div>
                        <div className="form-group">
                          <label>Take Profit (%)</label>
                          <input className="form-input mono" type="number" defaultValue="5.0" />
                        </div>
                      </div>
                      <div className="strategy-actions">
                        <button className="btn btn-primary" style={{ flex: 1 }}>Save Strategy</button>
                        <button className="btn btn-green btn-sm" onClick={handleStartBot}>▶ Activate</button>
                        <button className="btn btn-red btn-sm" onClick={handleStopBot}>⏹ Stop</button>
                      </div>
                      <div className="strategy-status">
                        <span className="status-label">Status:</span>
                        <span className="status-value" style={{ color: botRunning ? "var(--trade-green)" : "var(--trade-red)" }}>
                          {botRunning
                            ? `● Running — ${botStatus?.last_signal ?? "Waiting for signal"}`
                            : "● Stopped"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trade Execution */}
                  <div className="card">
                    <div className="trade-tabs">
                      <button className={`trade-tab ${tradeSide === "buy" ? "buy-active" : ""}`} onClick={() => setTradeSide("buy")}>
                        BUY / LONG
                      </button>
                      <button className={`trade-tab ${tradeSide === "sell" ? "sell-active" : ""}`} onClick={() => setTradeSide("sell")}>
                        SELL / SHORT
                      </button>
                    </div>
                    <div className="trade-form">
                      <div className="order-type-selector">
                        <button className={`order-type-btn ${orderType === "market" ? "active" : ""}`} onClick={() => setOrderType("market")}>
                          Market
                        </button>
                        <button className={`order-type-btn ${orderType === "limit" ? "active" : ""}`} onClick={() => setOrderType("limit")}>
                          Limit
                        </button>
                      </div>
                      {orderType === "limit" && (
                        <div className="form-group">
                          <label>Limit Price</label>
                          <input className="form-input mono" type="number" placeholder="67,842.50" />
                        </div>
                      )}
                      <div className="form-group">
                        <label>Position Size (BTC)</label>
                        <input className="form-input mono" type="number" placeholder="0.10" />
                      </div>
                      <div className="trade-form form-row" style={{ padding: 0 }}>
                        <div className="form-group">
                          <label>Stop Loss</label>
                          <input className="form-input mono" type="number" placeholder="66,500" />
                        </div>
                        <div className="form-group">
                          <label>Take Profit</label>
                          <input className="form-input mono" type="number" placeholder="69,000" />
                        </div>
                      </div>
                      <button
                        className={`btn ${tradeSide === "buy" ? "btn-green" : "btn-red"}`}
                        style={{ width: "100%", marginTop: 10 }}
                        onClick={handleManualTrade}
                      >
                        {tradeSide === "buy" ? "Buy / Long" : "Sell / Short"}{" "}
                        {selectedSymbol}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════════════ STRATEGY PAGE ════════════ */}
            {(currentPage === "strategy" || currentPage === "bot") && (
              <>
                <div className="card">
                  <div className="card-header">
                    <h3><span className="icon">⚙️</span> Strategy Configuration</h3>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label>Select Strategy</label>
                      <select className="form-input" value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value)}>
                        <option value="ma_cross">Moving Average Crossover</option>
                        <option value="rsi">RSI Strategy</option>
                        <option value="macd">MACD Strategy</option>
                        <option value="ai">AI Prediction Strategy</option>
                      </select>
                    </div>
                    <div className="strategy-grid">
                      <div className="form-group">
                        <label>Short Moving Average</label>
                        <input className="form-input mono" type="number" defaultValue="9" />
                      </div>
                      <div className="form-group">
                        <label>Long Moving Average</label>
                        <input className="form-input mono" type="number" defaultValue="21" />
                      </div>
                      <div className="form-group">
                        <label>RSI Threshold</label>
                        <input className="form-input mono" type="number" defaultValue="70" />
                      </div>
                      <div className="form-group">
                        <label>Stop Loss (%)</label>
                        <input className="form-input mono" type="number" defaultValue="2.5" />
                      </div>
                      <div className="form-group">
                        <label>Take Profit (%)</label>
                        <input className="form-input mono" type="number" defaultValue="5.0" />
                      </div>
                      <div className="form-group">
                        <label>Max Position Size</label>
                        <input className="form-input mono" type="number" defaultValue="0.5" />
                      </div>
                    </div>
                    <div className="strategy-actions">
                      <button className="btn btn-primary" style={{ flex: 2 }}>💾 Save Strategy</button>
                      <button className="btn btn-green" style={{ flex: 1 }} onClick={() => setBotRunning(true)}>
                        ▶ Activate Bot
                      </button>
                      <button className="btn btn-red" style={{ flex: 1 }} onClick={() => setBotRunning(false)}>
                        ⏹ Stop Bot
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bot Status */}
                <div className="card">
                  <div className="card-header">
                    <h3><span className="icon">🤖</span> Bot Control Panel</h3>
                  </div>
                  <div className="card-body">
                    <div className="strategy-grid">
                      <div className="strategy-status">
                        <span className="status-label">Status:</span>
                        <span className="status-value" style={{ color: botRunning ? "var(--trade-green)" : "var(--trade-red)" }}>
                          {botRunning ? "● Running" : "● Stopped"}
                        </span>
                      </div>
                      <div className="strategy-status">
                        <span className="status-label">Strategy:</span>
                        <span className="status-value">MA Crossover</span>
                      </div>
                      <div className="strategy-status">
                        <span className="status-label">Last Signal:</span>
                        <span className="status-value">
                          {botStatus?.last_signal ?? "—"}
                        </span>
                      </div>
                      <div className="strategy-status">
                        <span className="status-label">Last Price:</span>
                        <span className="status-value">
                          {botStatus?.last_price != null
                            ? `$${botStatus.last_price.toFixed(2)}`
                            : "—"}
                        </span>
                      </div>
                      <div className="strategy-status">
                        <span className="status-label">Live Socket Price:</span>
                        <span className="status-value">
                          {liveSocketPrice != null
                            ? `$${liveSocketPrice.toFixed(2)}`
                            : "—"}
                        </span>
                      </div>
                      <div className="strategy-status">
                        <span className="status-label">Backend Poll Interval:</span>
                        <span className="status-value">5s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════════════ PORTFOLIO ════════════ */}
            {currentPage === "portfolio" && (
              <>
                <div className="portfolio-stats">
                  <div className="stat-card">
                    <div className="stat-title">Total Balance</div>
                    <div className="stat-number" style={{ color: "var(--text-primary)" }}>
                      {primaryBalance !== null
                        ? `$${primaryBalance.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })}`
                        : "$124,582.40"}
                    </div>
                    <div className="stat-change" style={{ color: "var(--trade-green)" }}>
                      Live from Delta Exchange
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title">Open Positions</div>
                    <div className="stat-number" style={{ color: "var(--accent-blue)" }}>5</div>
                    <div className="stat-change" style={{ color: "var(--text-secondary)" }}>3 Long • 2 Short</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title">Margin Used</div>
                    <div className="stat-number" style={{ color: "var(--trade-yellow)" }}>$18,420</div>
                    <div className="stat-change" style={{ color: "var(--text-secondary)" }}>14.8% of balance</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title">Daily PnL</div>
                    <div className="stat-number" style={{ color: "var(--trade-green)" }}>+$2,845.60</div>
                    <div className="stat-change" style={{ color: "var(--trade-green)" }}>+2.34%</div>
                  </div>
                </div>

                <div className="two-col">
                  <div className="card">
                    <div className="card-header">
                      <h3><span className="icon">📈</span> Portfolio Equity</h3>
                    </div>
                    <div style={{ height: 220, padding: 16 }}>
                      <EquityChart data={equityData} color="#00d2ff" />
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3><span className="icon">🍩</span> Asset Allocation</h3>
                    </div>
                    <div className="card-body">
                      <PieChart
                        slices={[
                          { label: "BTC", value: 45, color: "#f7931a" },
                          { label: "ETH", value: 30, color: "#627eea" },
                          { label: "SOL", value: 15, color: "#00ffa3" },
                          { label: "USDT", value: 10, color: "#26a17b" },
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* Open Positions Table (static sample) */}
                <div className="card">
                  <div className="card-header">
                    <h3><span className="icon">📊</span> Open Positions</h3>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Side</th>
                          <th>Size</th>
                          <th>Entry Price</th>
                          <th>Mark Price</th>
                          <th>Unrealized PnL</th>
                          <th>Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>BTCUSDT</td>
                          <td><span className="badge badge-buy">Long</span></td>
                          <td className="mono-cell">0.15 BTC</td>
                          <td className="mono-cell">$67,320.50</td>
                          <td className="mono-cell">$67,842.50</td>
                          <td className="mono-cell" style={{ color: "var(--trade-green)" }}>+$78.30</td>
                          <td className="mono-cell">$6,732.05</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>ETHUSDT</td>
                          <td><span className="badge badge-sell">Short</span></td>
                          <td className="mono-cell">2.0 ETH</td>
                          <td className="mono-cell">$3,890.00</td>
                          <td className="mono-cell">$3,847.20</td>
                          <td className="mono-cell" style={{ color: "var(--trade-green)" }}>+$85.60</td>
                          <td className="mono-cell">$3,890.00</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>SOLUSDT</td>
                          <td><span className="badge badge-buy">Long</span></td>
                          <td className="mono-cell">25 SOL</td>
                          <td className="mono-cell">$144.20</td>
                          <td className="mono-cell">$142.85</td>
                          <td className="mono-cell" style={{ color: "var(--trade-red)" }}>-$33.75</td>
                          <td className="mono-cell">$3,605.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Portfolio (Backend) */}
                <div className="card">
                  <div className="card-header">
                    <h3><span className="icon">💻</span> Live Portfolio (Backend)</h3>
                  </div>
                  <div className="card-body">
                    {!portfolio && <div style={{ color: "var(--text-secondary)" }}>Loading portfolio from backend…</div>}
                    {portfolio && (
                      <div className="strategy-grid">
                        <div>
                          <div className="stat-title">Raw Balances</div>
                          <pre className="mono-cell" style={{ whiteSpace: "pre-wrap", fontSize: "0.75rem" }}>
                            {JSON.stringify(portfolio.balances, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="stat-title">Raw Positions</div>
                          <pre className="mono-cell" style={{ whiteSpace: "pre-wrap", fontSize: "0.75rem" }}>
                            {JSON.stringify(portfolio.positions, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ════════════ TRADE HISTORY ════════════ */}
            {currentPage === "history" && (
              <>
                <div className="card">
                  <div className="card-header">
                    <h3><span className="icon">📋</span> Trade History</h3>
                  </div>
                  <div className="card-body">
                    <div className="filter-bar">
                      <input
                        className="search-input"
                        placeholder="Search by ID or symbol…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <select className="filter-select" value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}>
                        <option value="all">All Sides</option>
                        <option value="buy">Buy Only</option>
                        <option value="sell">Sell Only</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Trade ID</th>
                          <th>Symbol</th>
                          <th>Side</th>
                          <th>Entry Price</th>
                          <th>Exit Price</th>
                          <th>Quantity</th>
                          <th>Profit / Loss</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTrades.map((t) => (
                          <tr key={t.id}>
                            <td className="mono-cell">{t.id}</td>
                            <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                            <td>
                              <span className={`badge badge-${t.side === "Buy" ? "buy" : "sell"}`}>
                                {t.side}
                              </span>
                            </td>
                            <td className="mono-cell">${t.entry.toLocaleString()}</td>
                            <td className="mono-cell">${t.exit.toLocaleString()}</td>
                            <td className="mono-cell">{t.qty}</td>
                            <td className="mono-cell" style={{ color: t.pnl >= 0 ? "var(--trade-green)" : "var(--trade-red)" }}>
                              {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                            </td>
                            <td style={{ color: "var(--text-secondary)" }}>{t.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Trade History (Backend) */}
                <div className="card">
                  <div className="card-header">
                    <h3><span className="icon">🔌</span> Live Trade History (Backend)</h3>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Trade ID</th>
                          <th>Symbol</th>
                          <th>Side</th>
                          <th>Entry Price</th>
                          <th>Quantity</th>
                          <th>Profit / Loss</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiTrades.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                              No trades from backend yet.
                            </td>
                          </tr>
                        )}
                        {apiTrades.map((t) => (
                          <tr key={t.trade_id}>
                            <td className="mono-cell">{t.trade_id}</td>
                            <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                            <td>
                              <span className={`badge badge-${t.side.toUpperCase() === "BUY" ? "buy" : "sell"}`}>
                                {t.side.toUpperCase()}
                              </span>
                            </td>
                            <td className="mono-cell">${t.entry_price.toLocaleString()}</td>
                            <td className="mono-cell">{t.quantity}</td>
                            <td
                              className="mono-cell"
                              style={{
                                color:
                                  (t.profit_loss ?? 0) >= 0 ? "var(--trade-green)" : "var(--trade-red)",
                              }}
                            >
                              {t.profit_loss !== null
                                ? `${t.profit_loss >= 0 ? "+" : ""}$${t.profit_loss.toFixed(2)}`
                                : "-"}
                            </td>
                            <td style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                              {new Date(t.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ════════════ BACKTESTING ════════════ */}
            {currentPage === "backtest" && (
              <>
                <div className="card">
                  <div className="card-header">
                    <h3><span className="icon">🧪</span> Backtest Configuration</h3>
                  </div>
                  <div className="card-body">
                    <div className="backtest-config">
                      <div className="form-group">
                        <label>Strategy</label>
                        <select className="form-input" value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value)}>
                          <option value="ma_cross">Moving Average Crossover</option>
                          <option value="rsi">RSI Strategy</option>
                          <option value="macd">MACD Strategy</option>
                          <option value="ai">AI Prediction Strategy</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Start Date</label>
                        <input className="form-input" type="date" defaultValue="2025-01-01" />
                      </div>
                      <div className="form-group">
                        <label>End Date</label>
                        <input className="form-input" type="date" defaultValue="2026-03-10" />
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setBacktestRun(true)}>
                      🚀 Run Backtest
                    </button>
                  </div>
                </div>

                {backtestRun && (
                  <>
                    <div className="backtest-metrics">
                      <div className="metric-card">
                        <div className="metric-value" style={{ color: "var(--trade-green)" }}>+32.0%</div>
                        <div className="metric-label">Total Profit</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value" style={{ color: "var(--trade-red)" }}>-8.4%</div>
                        <div className="metric-label">Max Drawdown</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value" style={{ color: "var(--accent-blue)" }}>68.2%</div>
                        <div className="metric-label">Win Rate</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value" style={{ color: "var(--accent-purple)" }}>1.84</div>
                        <div className="metric-label">Sharpe Ratio</div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <h3><span className="icon">📈</span> Backtest Performance</h3>
                      </div>
                      <div style={{ height: 240, padding: 16 }}>
                        <EquityChart data={backtestEquity} color="#8a2be2" />
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <h3><span className="icon">📊</span> Detailed Metrics</h3>
                      </div>
                      <div className="card-body">
                        <div className="strategy-grid">
                          <div className="stat-row">
                            <span className="stat-label">Total Trades</span>
                            <span className="stat-value">248</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Winning Trades</span>
                            <span className="stat-value" style={{ color: "var(--trade-green)" }}>169</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Losing Trades</span>
                            <span className="stat-value" style={{ color: "var(--trade-red)" }}>79</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Avg Win</span>
                            <span className="stat-value" style={{ color: "var(--trade-green)" }}>+$84.52</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Avg Loss</span>
                            <span className="stat-value" style={{ color: "var(--trade-red)" }}>-$42.18</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Profit Factor</span>
                            <span className="stat-value">2.41</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ════════════ SETTINGS ════════════ */}
            {currentPage === "settings" && (
              <div className="card">
                <div className="card-header">
                  <h3><span className="icon">⚡</span> Settings</h3>
                </div>
                <div className="card-body">
                  <div className="strategy-grid">
                    <div className="form-group">
                      <label>Delta Exchange API Key</label>
                      <input className="form-input mono" type="text" placeholder="Enter API key" />
                    </div>
                    <div className="form-group">
                      <label>API Secret</label>
                      <input className="form-input mono" type="password" placeholder="Enter API secret" />
                    </div>
                    <div className="form-group">
                      <label>Default Leverage</label>
                      <input className="form-input mono" type="number" defaultValue="10" />
                    </div>
                    <div className="form-group">
                      <label>Max Daily Loss (%)</label>
                      <input className="form-input mono" type="number" defaultValue="5" />
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: 18, width: "100%" }}>Save Settings</button>
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT ANALYTICS PANEL ═══ */}
          <aside className="workspace-right">
            {/* Market Sentiment */}
            <div className="card">
              <div className="analytics-widget">
                <h4>Market Sentiment</h4>
                <div className="sentiment-meter">
                  <div className="sentiment-fill" style={{ width: "72%" }} />
                </div>
                <div className="sentiment-labels">
                  <span>Fear</span>
                  <span>72 — Greed</span>
                </div>
              </div>
            </div>

            {/* Top Gainers */}
            <div className="card">
              <div className="analytics-widget">
                <h4>Top Gainers</h4>
                <div className="mover-list">
                  {[
                    { name: "BTC", pct: "+2.34%" },
                    { name: "ETH", pct: "+1.82%" },
                    { name: "AVAX", pct: "+5.21%" },
                    { name: "LINK", pct: "+3.47%" },
                  ].map((m) => (
                    <div className="mover-item" key={m.name}>
                      <span className="name">{m.name}</span>
                      <span className="pct" style={{ color: "var(--trade-green)" }}>{m.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Losers */}
            <div className="card">
              <div className="analytics-widget">
                <h4>Top Losers</h4>
                <div className="mover-list">
                  {[
                    { name: "SOL", pct: "-0.65%" },
                    { name: "DOGE", pct: "-2.18%" },
                    { name: "DOT", pct: "-1.43%" },
                  ].map((m) => (
                    <div className="mover-item" key={m.name}>
                      <span className="name">{m.name}</span>
                      <span className="pct" style={{ color: "var(--trade-red)" }}>{m.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategy Performance */}
            <div className="card">
              <div className="analytics-widget">
                <h4>Strategy Performance</h4>
                <div className="stat-row">
                  <span className="stat-label">Daily P&L</span>
                  <span className="stat-value" style={{ color: "var(--trade-green)" }}>+$485.23</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Win Rate</span>
                  <span className="stat-value" style={{ color: "var(--accent-blue)" }}>68.4%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Success Rate</span>
                  <span className="stat-value" style={{ color: "var(--accent-blue)" }}>74.2%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Total Trades</span>
                  <span className="stat-value">156</span>
                </div>
              </div>
            </div>

            {/* Mini Profit Curve */}
            <div className="card">
              <div className="analytics-widget">
                <h4>Profit Curve</h4>
                <div style={{ height: 100 }}>
                  <EquityChart
                    data={[0, 120, 85, 240, 190, 350, 420, 380, 485]}
                    color="#00e676"
                  />
                </div>
              </div>
            </div>

            {/* Win/Loss Ratio */}
            <div className="card">
              <div className="analytics-widget">
                <h4>Win / Loss Ratio</h4>
                <div style={{ display: "flex", gap: 4, height: 24, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ flex: 68, background: "var(--trade-green)", borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#0a0d14" }}>
                    68%
                  </div>
                  <div style={{ flex: 32, background: "var(--trade-red)", borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700 }}>
                    32%
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--trade-green)" }}>106 Wins</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--trade-red)" }}>50 Losses</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
