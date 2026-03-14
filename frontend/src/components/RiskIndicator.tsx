"use client";

import { useState } from 'react';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const timeframes = ['1m', '15m', '1h', '5h', '12h', '16h'];

const mockMetrics = {
  '1m': { volatility: 'Extreme', riskLevel: 'High', winRate: '54%', activeAgents: 5, vColor: 'text-rose-400', rColor: 'text-rose-400' },
  '15m': { volatility: 'High', riskLevel: 'High', winRate: '61%', activeAgents: 4, vColor: 'text-orange-400', rColor: 'text-orange-400' },
  '1h': { volatility: 'Medium', riskLevel: 'Medium', winRate: '68%', activeAgents: 3, vColor: 'text-yellow-400', rColor: 'text-yellow-400' },
  '5h': { volatility: 'Medium', riskLevel: 'Low', winRate: '72%', activeAgents: 2, vColor: 'text-yellow-400', rColor: 'text-emerald-400' },
  '12h': { volatility: 'Low', riskLevel: 'Low', winRate: '78%', activeAgents: 2, vColor: 'text-emerald-400', rColor: 'text-emerald-400' },
  '16h': { volatility: 'Low', riskLevel: 'Minimal', winRate: '81%', activeAgents: 1, vColor: 'text-emerald-400', rColor: 'text-blue-400' },
};

const getMetricsForAsset = (tf: string, asset: string) => {
  const base = mockMetrics[tf as keyof typeof mockMetrics];
  if (!base) return mockMetrics['1h'];
  
  if (asset.includes('ETH')) {
     return { ...base, winRate: parseInt(base.winRate) + 2 + '%', activeAgents: base.activeAgents + 1, volatility: base.volatility === 'Low' ? 'Medium' : base.volatility };
  }
  if (asset.includes('SOL')) {
     return { ...base, winRate: parseInt(base.winRate) - 4 + '%', activeAgents: base.activeAgents + 2, volatility: 'Extreme', vColor: 'text-rose-400', riskLevel: 'High', rColor: 'text-orange-400' };
  }
  return base;
};

export default function RiskIndicator({ asset = "BTC/USDT" }: { asset?: string }) {
  const [timeframe, setTimeframe] = useState('1h');
  const metrics = getMetricsForAsset(timeframe, asset);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/5 blur-3xl -z-10 rounded-full" />
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 relative z-20">
          <ShieldCheck size={24} className="text-blue-400" />
          <span className="hidden sm:inline">Dynamic Risk</span>
          <span className="text-sm font-medium text-gray-400 bg-white/5 px-2 py-1 rounded-md ml-2 border border-white/10">{asset}</span>
        </h3>
        
        <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 relative z-20">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeframe === tf ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-5">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center hover:border-yellow-500/30 transition-colors shadow-lg relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Zap size={28} className={`${metrics.vColor} mb-3`} />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Volatility</span>
          <AnimatePresence mode="popLayout">
            <motion.span key={metrics.volatility} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`text-2xl font-black mt-1 ${metrics.vColor}`}>{metrics.volatility}</motion.span>
          </AnimatePresence>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center hover:border-orange-500/30 transition-colors shadow-lg relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <AlertTriangle size={28} className={`${metrics.rColor} mb-3`} />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Risk Level</span>
          <AnimatePresence mode="popLayout">
            <motion.span key={metrics.riskLevel} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`text-2xl font-black mt-1 ${metrics.rColor}`}>{metrics.riskLevel}</motion.span>
          </AnimatePresence>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center hover:border-purple-500/30 transition-colors shadow-lg relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <AnimatePresence mode="popLayout">
            <motion.div key={metrics.winRate} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-black text-purple-400 mb-2 drop-shadow-[0_0_10px_rgba(192,132,252,0.4)]">{metrics.winRate}</motion.div>
          </AnimatePresence>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Win Rate</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center hover:border-emerald-500/30 transition-colors shadow-lg relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <AnimatePresence mode="popLayout">
            <motion.div key={metrics.activeAgents} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">{metrics.activeAgents}</motion.div>
          </AnimatePresence>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Agents</span>
        </motion.div>
      </div>
    </div>
  );
}
