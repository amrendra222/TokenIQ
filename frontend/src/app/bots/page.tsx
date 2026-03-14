"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Play, Square, Activity, Settings2, Plus, ShieldAlert, Cpu } from 'lucide-react';
import axios from 'axios';

interface BotConfig {
  id: string;
  asset: string;
  strategy: string;
  risk_level: string;
  amount: number;
  status: string;
  started_at: string;
  profit_loss: number;
  trades_executed: number;
}

export default function BotsPage() {
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showCreate, setShowCreate] = useState(false);
  const [newAsset, setNewAsset] = useState("BTC/USDT");
  const [newStrategy, setNewStrategy] = useState("Trend Following MACD");
  const [newRisk, setNewRisk] = useState("Medium");
  const [newAmount, setNewAmount] = useState(100);

  const fetchBots = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/bots');
      setBots(response.data);
    } catch (error) {
      console.error("Error fetching bots", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/bots/start', {
        asset: newAsset,
        strategy: newStrategy,
        risk_level: newRisk,
        amount: newAmount
      });
      setShowCreate(false);
      fetchBots();
    } catch (error) {
      console.error("Failed to start bot", error);
    }
  };

  const handleStopBot = async (botId: string) => {
    try {
      await axios.post(`http://localhost:8000/api/bots/stop/${botId}`);
      fetchBots();
    } catch (error) {
      console.error("Failed to stop bot", error);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-10 flex flex-col gap-8 bg-[#0a0a0f] text-white overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-[20%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <header className="relative z-10 flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 flex items-center gap-4">
             <Bot size={36} className="text-indigo-400" /> Autonomous Bots
          </h1>
          <p className="text-sm text-gray-400 mt-2 uppercase tracking-widest font-medium">Manage AI Trading Agents</p>
        </motion.div>

        <motion.button 
           initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
           onClick={() => setShowCreate(!showCreate)}
           className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-2xl transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
        >
           <Plus size={20} /> Deploy New Agent
        </motion.button>
      </header>

      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }} 
            animate={{ opacity: 1, height: 'auto', y: 0 }} 
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="glass-panel p-8 rounded-3xl border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.1)] relative z-10 overflow-hidden"
          >
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Cpu className="text-indigo-400"/> Configure AI Agent</h2>
             <form onSubmit={handleCreateBot} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Trading Pair</label>
                   <select value={newAsset} onChange={e => setNewAsset(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500/50">
                      <option value="BTC/USDT">BTC/USDT</option>
                      <option value="ETH/USDT">ETH/USDT</option>
                      <option value="SOL/USDT">SOL/USDT</option>
                      <option value="LINK/USDT">LINK/USDT</option>
                   </select>
                </div>
                
                <div className="flex flex-col gap-2">
                   <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Strategy Sub-Routine</label>
                   <select value={newStrategy} onChange={e => setNewStrategy(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500/50">
                      <option value="Trend Following MACD">Trend Following MACD</option>
                      <option value="Mean Reversion RSI">Mean Reversion RSI</option>
                      <option value="Breakout Volatility">Breakout Volatility</option>
                      <option value="Custom LLM Prompt">Custom LLM Prompt (Mapped)</option>
                   </select>
                </div>

                <div className="flex flex-col gap-2">
                   <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Risk Tolerance</label>
                   <select value={newRisk} onChange={e => setNewRisk(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500/50">
                      <option value="Low">Low (SL: 2%, TP: 4%)</option>
                      <option value="Medium">Medium (SL: 5%, TP: 10%)</option>
                      <option value="High">High (SL: 10%, TP: 25%)</option>
                      <option value="Degen">Degen (No SL, Ride or Die)</option>
                   </select>
                </div>

                <div className="flex flex-col gap-2">
                   <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Allocation ($)</label>
                   <input type="number" min="10" value={newAmount} onChange={e => setNewAmount(Number(e.target.value))} className="bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500/50" />
                </div>

                <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-2">
                   <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-3 text-gray-400 hover:text-white transition-colors">Cancel</button>
                   <button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                      <Play size={18} fill="currentColor" /> Initialize Engine
                   </button>
                </div>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 mt-4">
         {loading ? (
            <div className="col-span-full py-20 text-center text-gray-500 flex flex-col items-center justify-center gap-4">
               <Activity className="animate-pulse" size={48} />
               Scanning Active Clusters...
            </div>
         ) : bots.length === 0 ? (
            <div className="col-span-full glass-panel p-16 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center gap-4">
               <Bot size={64} className="text-gray-600 mb-2" />
               <h3 className="text-2xl font-bold text-gray-300">No Active Agents</h3>
               <p className="text-gray-500 max-w-md">You do not have any autonomous AI trading bots deployed in this cluster. Click 'Deploy New Agent' to spin one up.</p>
            </div>
         ) : (
            bots.map((bot, i) => (
              <motion.div 
                key={bot.id}
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`glass-panel p-6 rounded-3xl border ${bot.status === 'Running' ? 'border-indigo-500/30' : 'border-rose-500/30 opacity-75'} shadow-xl relative overflow-hidden group flex flex-col`}
              >
                  <div className="flex justify-between items-start mb-6 align-top">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <div className={`w-2 h-2 rounded-full ${bot.status === 'Running' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                           <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Agent {bot.id}</span>
                        </div>
                        <h3 className="text-2xl font-black">{bot.asset}</h3>
                     </div>
                     <div className="text-right">
                        <span className={`text-xl font-bold ${bot.profit_loss >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,113,0.5)]'}`}>
                           {bot.profit_loss >= 0 ? '+' : ''}${Math.abs(bot.profit_loss).toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Total PNL</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8 flex-1">
                     <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Settings2 size={12}/> Strategy</p>
                        <p className="text-sm font-semibold truncate text-indigo-300">{bot.strategy}</p>
                     </div>
                     <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><ShieldAlert size={12}/> Risk Profile</p>
                        <p className="text-sm font-semibold text-orange-300">{bot.risk_level}</p>
                     </div>
                     <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Allocation</p>
                        <p className="text-sm font-semibold">${bot.amount.toLocaleString()}</p>
                     </div>
                     <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Trades</p>
                        <p className="text-sm font-semibold">{bot.trades_executed}</p>
                     </div>
                  </div>

                  {bot.status === 'Running' ? (
                     <button 
                       onClick={() => handleStopBot(bot.id)}
                       className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                     >
                       <Square size={16} fill="currentColor" /> Terminate Agent
                     </button>
                  ) : (
                     <div className="w-full bg-gray-800/50 text-gray-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-white/5">
                        Offline
                     </div>
                  )}
              </motion.div>
            ))
         )}
      </div>

    </main>
  );
}
