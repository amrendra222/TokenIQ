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
  now.setMinutes(now.getMinutes() - 50);

  for (let i = 0; i < 50; i++) {
    const open = currentPrice;
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = low + Math.random() * (high - low);
    
    currentPrice = close;

    data.push({
      time: Math.floor(new Date(now.getTime() + i * 60000).getTime() / 1000) as any, // Unix timestamp in seconds
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

  useEffect(() => {
    if (!chartContainerRef.current) return;

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

    const initialData = generateCandleData(asset);
    seriesRef.current.setData(initialData);
    const initialLast = initialData[initialData.length - 1];
    setLastPrice(initialLast.close);
    
    currentCandleRef.current = {
      time: Math.floor(new Date().getTime() / 1000), 
      open: initialLast.close, 
      high: initialLast.close, 
      low: initialLast.close, 
      close: initialLast.close
    };

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [asset]);

  useEffect(() => {
    // In production, connect to fastAPI websocket here
    const interval = setInterval(() => {
      if (!seriesRef.current || !currentCandleRef.current) return;
      
      const volatility = getBasePrice(asset) * 0.005;
      
      const tick = (Math.random() - 0.45) * volatility;
      const newClose = currentCandleRef.current.close + tick;
      
      const newHigh = Math.max(currentCandleRef.current.high, newClose);
      const newLow = Math.min(currentCandleRef.current.low, newClose);

      const updatedCandle = {
        ...currentCandleRef.current,
        high: newHigh,
        low: newLow,
        close: newClose
      };
      
      currentCandleRef.current = updatedCandle;

      seriesRef.current.update({
        time: updatedCandle.time as any,
        open: Math.round(updatedCandle.open * 100) / 100,
        high: Math.round(updatedCandle.high * 100) / 100,
        low: Math.round(updatedCandle.low * 100) / 100,
        close: Math.round(updatedCandle.close * 100) / 100,
      });

      // Simple time progression mock for testing (new candle randomly every few ticks)
      if (Math.random() > 0.8) {
          const nextTime = updatedCandle.time + 60;
          currentCandleRef.current = {
             time: nextTime,
             open: newClose,
             high: newClose,
             low: newClose,
             close: newClose
          };
      }
      
    }, 500);

    return () => clearInterval(interval);
  }, [asset]);

  return (
    <div className="w-full h-full min-h-[300px] bg-black/20 rounded-xl p-2 relative overflow-hidden flex flex-col">
      <div 
        ref={chartContainerRef} 
        style={{ width: '100%', height: '300px' }} 
        className="flex-1"
      />
    </div>
  );
}
