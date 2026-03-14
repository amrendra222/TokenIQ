"use client";

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, History, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Trade {
  id: number;
  type: string;
  asset: string;
  amount: string;
  price: number;
  time: string;
  pnl: string;
  status: string;
}

interface PortfolioData {
  balance: number;
  profit_percentage: number;
  auto_trades_executed: number;
  profit_factor: number;
  recent_trades: Trade[];
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/portfolio');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch portfolio data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 3000); // Poll every 3s for live effect
    return () => clearInterval(interval);
  }, []);
  return (
    <main className="min-h-screen p-6 md:p-10 flex flex-col gap-8 bg-[#0a0a0f] text-white overflow-x-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-[20%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <header className="relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Portfolio Overview
          </h1>
          <p className="text-sm text-gray-400 mt-2 uppercase tracking-widest font-medium">Performance & Analytics</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mt-4">
        {/* Total Balance Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="col-span-1 md:col-span-2 glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="text-blue-400" size={24} />
                <span className="text-gray-400 font-medium tracking-wide uppercase text-sm">Estimated Balance</span>
              </div>
              <h2 className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] tracking-tight">
                ${data ? data.balance.toLocaleString() : '---'}<span className="text-3xl text-gray-400"></span>
              </h2>
            </div>
            <div className={`bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-2xl flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}>
              <TrendingUp className="text-emerald-400" size={20} />
              <span className="text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                +{data ? data.profit_percentage : '--'}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-center gap-6"
        >
           <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <span className="text-gray-400 font-medium">Auto-Trades Executed</span>
              <span className="text-2xl font-black text-blue-400">{data ? data.auto_trades_executed.toLocaleString() : '--'}</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Profit Factor</span>
              <span className="text-2xl font-black text-purple-400">{data ? data.profit_factor : '--'}</span>
           </div>
        </motion.div>
      </div>

      {/* Trade History */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
        className="glass-panel mt-6 border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden z-10"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <div className="flex items-center gap-3">
             <History className="text-indigo-400" size={20} />
             <h3 className="text-lg font-bold tracking-wide">Recent AI Operations {loading && <RefreshCw size={14} className="inline animate-spin ml-2 text-gray-500"/>}</h3>
           </div>
           <span className="text-xs text-green-400 border border-green-500/30 bg-green-500/10 px-2 py-1 rounded">Live Connect</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-widest bg-black/20">
                <th className="p-6 font-semibold">Asset</th>
                <th className="p-6 font-semibold">Type</th>
                <th className="p-6 font-semibold">Price</th>
                <th className="p-6 font-semibold">Amount</th>
                <th className="p-6 font-semibold text-right">Realized PNL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!data ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Loading live operations...</td>
                </tr>
              ) : data.recent_trades.map((trade: Trade, i: number) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.3, delay: 0.1 + (i * 0.1) }}
                  key={trade.id} 
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${trade.type === 'Buy' ? 'bg-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,1)]' : 'bg-rose-400 drop-shadow-[0_0_5px_rgba(244,63,113,1)]'}`} />
                      <span className="font-bold">{trade.asset}</span>
                      <span className="text-xs text-gray-500">{trade.time}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                      trade.type === 'Buy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="p-6 font-medium text-gray-300">${trade.price.toLocaleString()}</td>
                  <td className="p-6 font-medium text-gray-300">{trade.amount}</td>
                  <td className="p-6 text-right font-black flex justify-end items-center gap-2">
                    {trade.status === 'profit' ? <ArrowUpRight className="text-emerald-400" size={16}/> : <ArrowDownRight className="text-rose-400" size={16}/>}
                    <span className={trade.status === 'profit' ? 'text-emerald-400' : 'text-rose-400'}>
                      {trade.pnl}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </main>
  );
}
