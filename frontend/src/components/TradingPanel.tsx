"use client";

import { useState, useEffect } from 'react';
import { Send, Activity, BrainCircuit, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function TradingPanel({ asset = "BTC/USDT" }: { asset?: string }) {
  const [strategy, setStrategy] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPrediction, setLastPrediction] = useState("Waiting...");
  const [confidence, setConfidence] = useState(0);
  const [parsedStrategy, setParsedStrategy] = useState<{buy_condition?: string, sell_condition?: string} | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/market_updates');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'MARKET_UPDATE' && (data.symbol === asset || data.symbol === 'BTC/USDT')) {
           setLastPrediction(data.prediction);
           setConfidence(Math.round(data.confidence * 100));
        }
      } catch (error) {
        console.error("Error parsing websocket message", error);
      }
    };

    return () => {
      ws.close();
    };
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategy) return;
    setIsProcessing(true);
    
    try {
      const response = await axios.post('http://localhost:8000/api/strategy/parse', { strategy });
      setParsedStrategy(response.data);
      setStrategy("");
    } catch (error) {
      console.error("Failed to parse strategy", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex-1 relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl -z-10 rounded-full" />
        <h3 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3">
          <BrainCircuit size={24} className="text-emerald-400" /> AI Strategy Engine
        </h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
          <label className="text-sm font-medium text-gray-400 tracking-wide uppercase">Natural Language Instruction</label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <textarea 
              className="relative w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 outline-none focus:border-blue-500/50 transition-colors resize-none h-28 backdrop-blur-md placeholder:text-gray-600"
              placeholder="e.g. 'Buy BTC when RSI is below 30 and MACD crosses over'"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={isProcessing}
            className="group relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-900 disabled:to-indigo-900 text-white font-semibold py-3 px-6 rounded-2xl transition-all flex justify-center items-center gap-3 overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:shadow-none"
          >
            {isProcessing ? (
               <span className="animate-pulse flex items-center gap-2">Processing <Activity size={18} /></span>
            ) : (
               <>
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                 <span className="relative z-10 flex items-center gap-2">Deploy Strategy <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></span>
               </>
            )}
          </button>
        </form>

        <AnimatePresence>
          {parsedStrategy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 bg-black/40 border border-emerald-500/20 rounded-2xl p-4 overflow-hidden"
            >
              <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                 <Code size={14} className="text-emerald-400" /> Parsed LLM Execution Rules
              </h4>
              <div className="space-y-2 text-sm font-mono overflow-x-auto">
                 <div className="flex justify-between items-center bg-black/50 p-2 rounded-lg w-full border border-white/5">
                    <span className="text-emerald-400 pr-4">Buy:</span>
                    <span className="text-gray-300 text-right">{parsedStrategy.buy_condition || 'N/A'}</span>
                 </div>
                 <div className="flex justify-between items-center bg-black/50 p-2 rounded-lg w-full border border-white/5 mt-2">
                    <span className="text-rose-400 pr-4">Sell:</span>
                    <span className="text-gray-300 text-right">{parsedStrategy.sell_condition || 'N/A'}</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-white/5 pt-6">
        <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">Latest Bot Signal</h4>
        <AnimatePresence mode="wait">
          <motion.div 
            key={lastPrediction}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-inner"
          >
             <div>
               <span className={`text-2xl font-black ${lastPrediction.includes('Buy') ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : lastPrediction.includes('Sell') ? 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,113,0.5)]' : 'text-gray-300'}`}>
                  {lastPrediction}
               </span>
               <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Multi-Agent Consensus</p>
             </div>
             <div className="text-right">
               <span className="text-xl font-bold text-blue-400 tracking-tight">{confidence}%</span>
               <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Confidence</p>
             </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="flex-1 mt-2">
        <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">Active Positions</h4>
        <div className="bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-inner flex flex-col gap-3 group hover:border-emerald-500/30 transition-colors">
           <div className="flex justify-between items-center">
             <span className="text-sm font-bold text-gray-200 tracking-wide">{asset}</span>
             <span className="text-sm font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">+2.45%</span>
           </div>
           <div className="w-full bg-gray-800/50 rounded-full h-2 mt-1 overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '45%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
              />
           </div>
        </div>
      </div>
    </div>
  );
}
