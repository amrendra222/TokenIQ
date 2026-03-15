"use client";

import { useState } from 'react';
import LiveChart from '../components/LiveChart';
import TradingPanel from '../components/TradingPanel';
import RiskIndicator from '../components/RiskIndicator';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function DashboardPage() {
  const [selectedAsset, setSelectedAsset] = useState('BTC/USDT');
  const assets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

  return (
    <main className="min-h-screen p-6 flex flex-col gap-8 bg-[#0a0a0f] text-white overflow-x-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            AlgoTrader
          </h1>
          <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-medium">Auto-Trading Terminal</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-4"
        >
          <div className="px-5 py-2.5 glass-panel flex items-center gap-3 backdrop-blur-xl border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] rounded-2xl">
             <div className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
             </div>
             <span className="text-sm font-semibold tracking-wide text-emerald-100">Live Testnet</span>
          </div>
          <div className="px-5 py-2.5 glass-panel rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg">
             <span className="text-sm text-gray-400 mr-2 uppercase tracking-wide">Assets:</span>
             <span className="font-bold text-white tracking-wide">$12,450.00 <span className="text-xs text-gray-500">USDT</span></span>
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 relative z-10 h-full">
        {/* Main Chart Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-3 flex flex-col gap-6"
        >
          <div className="glass-panel p-6 flex-1 min-h-[500px] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="flex justify-between items-center mb-6 relative z-20">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <div className="relative group/dropdown">
                  <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm border border-blue-500/30 flex items-center gap-2 hover:bg-blue-500/30 transition-colors cursor-pointer">
                    {selectedAsset} <ChevronDown size={14} />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-36 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:pointer-events-auto transition-opacity z-50">
                    {assets.map((asset) => (
                      <button
                        key={asset}
                        onClick={() => setSelectedAsset(asset)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5 ${selectedAsset === asset ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-gray-300'}`}
                      >
                        {asset}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-gray-300">Live Analysis</span>
              </h2>
            </div>
            <LiveChart asset={selectedAsset} />
          </div>
          <div className="glass-panel p-6 border border-white/10 rounded-3xl shadow-xl">
             <RiskIndicator asset={selectedAsset} />
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-panel p-6 flex flex-col gap-6 border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -z-10" />
          <TradingPanel asset={selectedAsset} />
        </motion.div>
      </div>
    </main>
  );
}
