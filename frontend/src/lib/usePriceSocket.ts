"use client";

import { useEffect, useState } from "react";

export function usePriceSocket(symbol = "BTCUSDT") {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const WS_BASE =
      process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:8000";
    const ws = new WebSocket(`${WS_BASE}/ws/price`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.symbol === symbol) {
          setPrice(data.price);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  return price;
}

