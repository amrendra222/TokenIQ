"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, Activity, TrendingUp, TrendingDown, RefreshCw, BarChart2 } from 'lucide-react';
import axios from 'axios';

interface NewsItem {
  id: number;
  source: string;
  text: string;
  sentiment: number;
  time: string;
}

interface SentimentData {
  asset: string;
  sentiment_index: number;
  global_label: string;
  feed: NewsItem[];
  timestamp: string;
}

export default function SentimentPage() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState("BTC/USDT");

  const fetchSentiment = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/sentiment?asset=${asset}`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching sentiment", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
  }, [asset]);

  return (
    <main className="min-h-screen p-6 md:p-10 flex flex-col gap-8 bg-[#0a0a0f] text-white overflow-x-hidden relative">
      <div className="absolute top-0 right-[10%] w-[30%] h-[30%] bg-pink-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-[20%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <header className="relative z-10 flex justify-between items-end flex-wrap gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 flex items-center gap-4">
             <MessageSquareText size={36} className="text-pink-400" /> Market Sentiment
          </h1>
          <p className="text-sm text-gray-400 mt-2 uppercase tracking-widest font-medium">Real-time Social & News Analysis</p>
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
            onClick={fetchSentiment}
            disabled={loading}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 mt-4">
         {/* Left Column: Global Index */}
         <div className="flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center h-full min-h-[350px]"
            >
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8 w-full text-left">Global Sentiment Index</h3>
               
               {loading && !data ? (
                 <Activity className="animate-pulse text-gray-500" size={48} />
               ) : (
                 <>
                   <div className="relative w-48 h-48 flex items-center justify-center">
                     {/* Circular gauge background */}
                     <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                        <motion.circle 
                          initial={{ strokeDasharray: "0 300" }}
                          animate={{ strokeDasharray: `${(data?.sentiment_index || 0) * 2.8} 300` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          cx="50" cy="50" r="45" fill="none" 
                          stroke={data?.sentiment_index && data.sentiment_index >= 60 ? "url(#gradient-green)" : data?.sentiment_index && data.sentiment_index <= 40 ? "url(#gradient-red)" : "url(#gradient-yellow)"} 
                          strokeWidth="10" 
                          strokeLinecap="round" 
                        />
                        <defs>
                          <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                          <linearGradient id="gradient-red" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f87171" />
                            <stop offset="100%" stopColor="#e11d48" />
                          </linearGradient>
                          <linearGradient id="gradient-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>
                        </defs>
                     </svg>
                     <div className="absolute flex flex-col items-center text-center">
                       <span className={`text-6xl font-black ${
                          data?.global_label === 'Greed' ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 
                          data?.global_label === 'Fear' ? 'text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,113,0.5)]' : 
                          'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                       }`}>
                         {data?.sentiment_index || 0}
                       </span>
                     </div>
                   </div>
                   
                   <h2 className={`text-3xl font-black mt-6 tracking-tight uppercase ${
                      data?.global_label === 'Greed' ? 'text-emerald-400' : 
                      data?.global_label === 'Fear' ? 'text-rose-400' : 
                      'text-amber-400'
                   }`}>
                      {data?.global_label || 'Scanning...'}
                   </h2>
                   <p className="text-gray-400 mt-2 text-sm italic">AI Consensus from {data?.feed?.length || 0} active sources</p>
                 </>
               )}
            </motion.div>
         </div>

         {/* Right Column: Live Feed */}
         <div className="lg:col-span-2 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl h-full"
            >
               <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl mb-6">
                 <h3 className="font-bold tracking-wide flex items-center gap-2"><BarChart2 className="text-purple-400" size={20}/> Live AI News Feed</h3>
                 {!loading && data && <span className="text-xs text-gray-500">Updated at {data.timestamp.split(' ')[1]}</span>}
               </div>

               <div className="flex flex-col gap-4">
                  {!data ? (
                    <div className="py-20 text-center text-gray-500 w-full animate-pulse">Waiting for AI parser...</div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                       {data.feed.map((item, index) => (
                         <motion.div 
                           key={item.id}
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ duration: 0.4, delay: index * 0.1 }}
                           className={`p-5 rounded-2xl border bg-black/40 ${
                             item.sentiment > 0.3 ? 'border-emerald-500/20 hover:border-emerald-500/40' : 
                             item.sentiment < -0.3 ? 'border-rose-500/20 hover:border-rose-500/40' : 
                             'border-white/5 hover:border-white/20'
                           } transition-colors group flex gap-4 items-start`}
                         >
                            <div className={`p-3 rounded-xl ${
                               item.sentiment > 0.3 ? 'bg-emerald-500/10 text-emerald-400' : 
                               item.sentiment < -0.3 ? 'bg-rose-500/10 text-rose-400' : 
                               'bg-white/5 text-gray-400'
                            }`}>
                               {item.sentiment > 0 ? <TrendingUp size={24}/> : item.sentiment < 0 ? <TrendingDown size={24}/> : <Activity size={24}/>}
                            </div>
                            <div className="flex-1">
                               <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold uppercase tracking-widest text-[#a8b1c4] opacity-80">{item.source}</span>
                                  <span className="text-xs text-gray-500">{item.time}</span>
                               </div>
                               <p className="text-gray-200 font-medium leading-relaxed">{item.text}</p>
                            </div>
                            <div className="hidden md:flex flex-col items-end justify-center h-full pt-2">
                               <span className={`text-sm font-bold ${
                                  item.sentiment > 0 ? 'text-emerald-400' : item.sentiment < 0 ? 'text-rose-400' : 'text-gray-400'
                               }`}>
                                 {item.sentiment > 0 ? '+' : ''}{item.sentiment.toFixed(2)}
                               </span>
                               <span className="text-[10px] text-gray-500 uppercase tracking-widest">Score</span>
                            </div>
                         </motion.div>
                       ))}
                    </AnimatePresence>
                  )}
               </div>
            </motion.div>
         </div>
      </div>
    </main>
  );
}
