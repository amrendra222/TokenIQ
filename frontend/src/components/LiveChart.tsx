"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

// Dummy data for testing
const getBasePrice = (asset: string) => {
  if (asset.includes('BTC')) return 65000;
  if (asset.includes('ETH')) return 3500;
  if (asset.includes('SOL')) return 150;
  return 1000;
};

const generateCandleData = (asset: string) => {
  const data = [];
  let currentPrice = getBasePrice(asset);
  const volatility = currentPrice * 0.005; // 0.5% volatility
  
  const now = new Date();
  // Align to the start of the current minute
  const currentMinute = Math.floor(now.getTime() / 60000) * 60;

  for (let i = 0; i < 50; i++) {
    const time = currentMinute - (50 - i) * 60;
    const open = currentPrice;
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = low + Math.random() * (high - low);
    
    currentPrice = close;

    data.push({
      time: time as any,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });
  }
  return data;
};

export default function LiveChart({ asset = "BTC/USDT" }: { asset?: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [lastPrice, setLastPrice] = useState(getBasePrice(asset));
  const currentCandleRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (!mounted || !chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        },
      },
      crosshair: {
        mode: 1, // Normal crosshair
      },
    });

    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#34d399',
      downColor: '#f87171',
      borderVisible: false,
      wickUpColor: '#34d399',
      wickDownColor: '#f87171',
    });

    // Fetch real historical data from backend
    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/ohlcv?asset=${encodeURIComponent(asset)}&limit=100`);
        const initialData = await response.json();
        
        if (initialData && initialData.length > 0) {
          console.log(`CHART [${asset}]: Setting initial data (${initialData.length} bars)`);
          seriesRef.current.setData(initialData);
          
          const initialLast = initialData[initialData.length - 1];
          setLastPrice(initialLast.close);
          currentCandleRef.current = { ...initialLast };
          
          // Ensure chart fits all content
          setTimeout(() => {
            if (chartRef.current) chartRef.current.timeScale().fitContent();
          }, 100);
        } else {
          // Fallback to dummy data if API empty
          const dummyData = generateCandleData(asset);
          seriesRef.current.setData(dummyData);
          const last = dummyData[dummyData.length - 1];
          setLastPrice(last.close);
          currentCandleRef.current = { ...last };
        }
      } catch (e) {
        console.error("Failed to fetch history, using dummy data", e);
        const dummyData = generateCandleData(asset);
        seriesRef.current.setData(dummyData);
        const last = dummyData[dummyData.length - 1];
        setLastPrice(last.close);
        currentCandleRef.current = { ...last };
      }
    };

    fetchHistory();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // WebSocket logic
    const host = window.location.hostname || 'localhost';
    console.log(`CHART [${asset}]: Connecting to ws://${host}:8000/ws/market_updates`);
    let socket: WebSocket | null = null;
    let fallbackInterval: any = null;
    let lastUpdate = Date.now();

    const startFallback = () => {
      console.log(`CHART [${asset}]: Starting local simulation fallback`);
      fallbackInterval = setInterval(() => {
        if (!seriesRef.current || !currentCandleRef.current) return;
        
        const volatility = getBasePrice(asset) * 0.002;
        const tick = (Math.random() - 0.5) * volatility;
        const newClose = currentCandleRef.current.close + tick;
        
        const now = Math.floor(Date.now() / 1000);
        const candleTime = Math.floor(now / 60) * 60;

        if (candleTime > currentCandleRef.current.time) {
          currentCandleRef.current = {
            time: candleTime,
            open: currentCandleRef.current.close,
            high: Math.max(currentCandleRef.current.close, newClose),
            low: Math.min(currentCandleRef.current.close, newClose),
            close: newClose
          };
        } else {
          currentCandleRef.current.high = Math.max(currentCandleRef.current.high, newClose);
          currentCandleRef.current.low = Math.min(currentCandleRef.current.low, newClose);
          currentCandleRef.current.close = newClose;
        }

        seriesRef.current.update({
          ...currentCandleRef.current,
          open: Math.round(currentCandleRef.current.open * 100) / 100,
          high: Math.round(currentCandleRef.current.high * 100) / 100,
          low: Math.round(currentCandleRef.current.low * 100) / 100,
          close: Math.round(currentCandleRef.current.close * 100) / 100,
        });
        setLastPrice(newClose);
      }, 1000);
    };

    try {
      socket = new WebSocket(`ws://${host}:8000/ws/market_updates`);

      socket.onopen = () => {
        console.log('WebSocket connected');
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      };

      socket.onerror = (err) => {
        console.error('WebSocket error, falling back:', err);
        if (!fallbackInterval) startFallback();
      };

      socket.onmessage = (event) => {
        lastUpdate = Date.now();
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'MARKET_UPDATE' && data.symbol === asset) {
            const price = data.price;
            const now = Math.floor(Date.now() / 1000);
            const candleTime = Math.floor(now / 60) * 60;

            if (!currentCandleRef.current || candleTime > currentCandleRef.current.time) {
              currentCandleRef.current = {
                time: candleTime,
                open: currentCandleRef.current?.close || price,
                high: price,
                low: price,
                close: price
              };
            } else {
              currentCandleRef.current.high = Math.max(currentCandleRef.current.high, price);
              currentCandleRef.current.low = Math.min(currentCandleRef.current.low, price);
              currentCandleRef.current.close = price;
            }

            seriesRef.current.update({
              time: currentCandleRef.current.time as any,
              open: Math.round(currentCandleRef.current.open * 100) / 100,
              high: Math.round(currentCandleRef.current.high * 100) / 100,
              low: Math.round(currentCandleRef.current.low * 100) / 100,
              close: Math.round(currentCandleRef.current.close * 100) / 100,
            });

            setLastPrice(price);
          }
        } catch (e) {
          console.error('Failed to parse socket message', e);
        }
      };
    } catch (e) {
      console.error('WebSocket connection failed', e);
      startFallback();
    }

    // Monitor connection
    const monitor = setInterval(() => {
      if (Date.now() - lastUpdate > 5000 && !fallbackInterval) {
        console.warn('No updates for 5s, starting fallback');
        startFallback();
      }
    }, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (socket) socket.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
      clearInterval(monitor);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [asset, mounted]);

  return (
    <div className="w-full h-full min-h-[400px] bg-black/40 rounded-3xl p-4 relative overflow-hidden flex flex-col border border-white/5 shadow-2xl">
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black text-white tracking-tighter">${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className="px-2.5 py-1 bg-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE
            </div>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1.5 flex items-center gap-2">
            {asset} Market Price 
            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
            <span className="text-gray-600">Local Time Sync</span>
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs font-bold text-white tracking-tight">{mounted ? currentTime : '--:--:--'}</div>
          <div className="text-[9px] text-gray-600 font-bold tracking-tight uppercase mt-1">IST (GMT+5:30)</div>
        </div>
      </div>
      <div 
        ref={chartContainerRef} 
        style={{ width: '100%', height: '350px' }} 
        className="flex-1 rounded-2xl overflow-hidden"
      />
    </div>
  );
}
