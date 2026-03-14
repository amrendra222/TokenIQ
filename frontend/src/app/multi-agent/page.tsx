"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Activity, TrendingUp, TrendingDown, RefreshCw, ShieldCheck, Target, Zap, Globe } from 'lucide-react';
import axios from 'axios';

interface Agent {
  name: string;
  type: string;
  signal: string;
  confidence: number;
  description: string;
}

interface MultiAgentData {
  asset: string;
  consensus: string;
  overall_confidence: number;
  agents: Agent[];
  timestamp: string;
}

export default function MultiAgentPage() {
  const [data, setData] = useState<MultiAgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState("BTC/USDT");

  const fetchConsensus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/multi-agent?asset=${asset}`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching multi-agent consensus", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsensus();
    const interval = setInterval(fetchConsensus, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [asset]);

  const getAgentIcon = (name: string) => {
    switch(name) {
      case 'Trend Follower': return <TrendingUp size={20} />;
      case 'Mean Reversion': return <Target size={20} />;
      case 'Sentiment AI': return <Globe size={20} />;
      case 'Arbitrage': return <Zap size={20} />;
      default: return <Activity size={20} />;
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-10 flex flex-col gap-8 bg-[#0a0a0f] text-white overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <header className="relative z-10 flex justify-between items-end flex-wrap gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 flex items-center gap-4">
             <Layers size={36} className="text-cyan-400" /> Multi-Agent Consensus
          </h1>
          <p className="text-sm text-gray-400 mt-2 uppercase tracking-widest font-medium">Aggregated AI Decision Intelligence</p>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
           className="flex items-center gap-4 bg-black/40 border border-white/10 p-2 rounded-2xl"
        >
          <select 
            value={asset} 
            onChange={(e) => setAsset(e.target.value)}
            className="bg-transparent border-none text-white outline-none font-bold px-4 py-2 cursor-pointer"
          >
            <option value="BTC/USDT" className="bg-gray-900">Bitcoin (BTC)</option>
            <option value="ETH/USDT" className="bg-gray-900">Ethereum (ETH)</option>
            <option value="SOL/USDT" className="bg-gray-900">Solana (SOL)</option>
          </select>
          <button 
            onClick={fetchConsensus}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 relative z-10 mt-4">
         {/* Main Consensus Panel */}
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
           className="xl:col-span-1 glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden h-full min-h-[400px]"
         >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-12 w-full text-left">Aggregated Signal</h3>
            
            {loading && !data ? (
              <Activity className="animate-pulse text-blue-500" size={64} />
            ) : (
              <>
                <div className={`text-7xl font-black mb-4 ${
                  data?.consensus === 'Buy' ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]' :
                  data?.consensus === 'Sell' ? 'text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,113,0.6)]' :
                  'text-gray-400'
                }`}>
                  {data?.consensus || '---'}
                </div>
                <div className="flex items-center gap-2 mb-8 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                   <ShieldCheck className="text-blue-400" size={18} />
                   <span className="text-2xl font-bold tracking-tight">{data?.overall_confidence || 0}% Confidence</span>
                </div>
                <p className="text-gray-400 text-sm max-w-[200px] leading-relaxed">
                   Consensus reached across 4 specialized AI agents at {data?.timestamp}
                </p>
              </>
            )}
         </motion.div>

         {/* Individual Agents Grid */}
         <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
               {data?.agents.map((agent, i) => (
                 <motion.div 
                   key={agent.name}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
                   className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       {getAgentIcon(agent.name)}
                    </div>
                    
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80">{agent.type}</span>
                          </div>
                          <h4 className="text-xl font-bold">{agent.name}</h4>
                       </div>
                       <div className="text-right">
                          <span className={`text-2xl font-black ${
                            agent.signal === 'Buy' ? 'text-emerald-400' :
                            agent.signal === 'Sell' ? 'text-rose-400' :
                            'text-gray-400'
                          }`}>
                            {agent.signal}
                          </span>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Agent Signal</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden relative">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${agent.confidence}%` }}
                             transition={{ duration: 1, ease: 'easeOut' }}
                             className={`absolute top-0 left-0 h-full rounded-full ${
                               agent.signal === 'Buy' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                               agent.signal === 'Sell' ? 'bg-gradient-to-r from-rose-600 to-rose-400' :
                               'bg-gray-600'
                             }`}
                          />
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 flex items-center gap-1">
                             Confidence Score
                          </span>
                          <span className="font-bold text-blue-400">{agent.confidence}%</span>
                       </div>
                       <p className="text-xs text-gray-500 leading-relaxed italic border-t border-white/5 pt-4">
                          "{agent.description}"
                       </p>
                    </div>
                 </motion.div>
               ))}
            </AnimatePresence>
         </div>
      </div>

      {/* Decision Matrix Logic Section */}
      <motion.div 
         initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
         className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
      >
         <div className="flex items-center gap-3 mb-6">
            <Activity className="text-indigo-400" size={24} />
            <h3 className="text-xl font-bold">Consensus Logic Matrix</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">Weighting Engine</p>
                <p className="text-sm text-gray-400 leading-relaxed">Each agent's signal is weighted by its confidence score. A 100% confidence signal from the Sentiment AI carries more weight than an 80% confidence signal from Trend Following.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">Conflict Resolution</p>
                <p className="text-sm text-gray-400 leading-relaxed">If agents are split 50/50 between Buy and Sell, the system defaults to "Hold" to preserve capital until a clear consensus emerges.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">Consensus Threshold</p>
                <p className="text-sm text-gray-400 leading-relaxed">Requires a cumulative weighted confidence of &gt; 65% for a "Strong" signal, otherwise it is classified as a standard directional bias.</p>
            </div>
         </div>
      </motion.div>
    </main>
  );
}
