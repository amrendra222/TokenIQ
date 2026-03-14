const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchLatestPrice(symbol = "BTCUSDT") {
  const url = new URL("/market/price", API_BASE);
  url.searchParams.set("symbol", symbol);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch price");
  return res.json() as Promise<{ symbol: string; price: number }>;
}

export async function startBot() {
  const res = await fetch(`${API_BASE}/bot/start`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start bot");
  return res.json();
}

export async function stopBot() {
  const res = await fetch(`${API_BASE}/bot/stop`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to stop bot");
  return res.json();
}

export async function getBotStatus() {
  const res = await fetch(`${API_BASE}/bot/status`);
  if (!res.ok) throw new Error("Failed to get bot status");
  return res.json() as Promise<{
    running: boolean;
    last_signal: string | null;
    last_price: number | null;
  }>;
}

export async function fetchTradeHistory() {
  const res = await fetch(`${API_BASE}/trade/history`);
  if (!res.ok) throw new Error("Failed to fetch trade history");
  return res.json() as Promise<
    {
      trade_id: string;
      symbol: string;
      side: string;
      entry_price: number;
      quantity: number;
      profit_loss: number | null;
      timestamp: string;
    }[]
  >;
}

export async function fetchPortfolio() {
  const res = await fetch(`${API_BASE}/portfolio`);
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  return res.json();
}

export async function executeTrade(side: "BUY" | "SELL", symbol = "BTCUSDT") {
  const url = new URL("/trade/execute", API_BASE);
  url.searchParams.set("side", side);
  url.searchParams.set("symbol", symbol);
  const res = await fetch(url.toString(), { method: "POST" });
  if (!res.ok) throw new Error("Failed to execute trade");
  return res.json();
}

