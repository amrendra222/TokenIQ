"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { BrainCircuit, LineChart, LayoutDashboard, Bot, MessageSquareText, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const { isLoaded, userId } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 group-hover:border-blue-400 overflow-hidden transition-colors">
              <BrainCircuit className="text-blue-400 relative z-10" size={18} />
              <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-400/30 transition-colors" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              DeltaAI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className={`relative px-4 py-2 text-sm font-medium transition-colors ${pathname === '/' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              <span className="flex items-center gap-2 relative z-10"><LayoutDashboard size={16} /> Dashboard</span>
              {pathname === '/' && (
                <motion.div layoutId="navbar-indicator" className="absolute inset-0 bg-white/5 rounded-lg border border-white/10" />
              )}
            </Link>
            <Link href="/portfolio" className={`relative px-4 py-2 text-sm font-medium transition-colors ${pathname === '/portfolio' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              <span className="flex items-center gap-2 relative z-10"><LineChart size={16} /> Portfolio</span>
              {pathname === '/portfolio' && (
                <motion.div layoutId="navbar-indicator" className="absolute inset-0 bg-white/5 rounded-lg border border-white/10" />
              )}
            </Link>
            <Link href="/bots" className={`relative px-4 py-2 text-sm font-medium transition-colors ${pathname === '/bots' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              <span className="flex items-center gap-2 relative z-10"><Bot size={16} /> Agents</span>
              {pathname === '/bots' && (
                <motion.div layoutId="navbar-indicator" className="absolute inset-0 bg-white/5 rounded-lg border border-white/10" />
              )}
            </Link>
            <Link href="/sentiment" className={`relative px-4 py-2 text-sm font-medium transition-colors ${pathname === '/sentiment' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              <span className="flex items-center gap-2 relative z-10"><MessageSquareText size={16} /> Sentiment</span>
              {pathname === '/sentiment' && (
                <motion.div layoutId="navbar-indicator" className="absolute inset-0 bg-white/5 rounded-lg border border-white/10" />
              )}
            </Link>
            <Link href="/multi-agent" className={`relative px-4 py-2 text-sm font-medium transition-colors ${pathname === '/multi-agent' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              <span className="flex items-center gap-2 relative z-10"><Layers size={16} /> Multi-Agent</span>
              {pathname === '/multi-agent' && (
                <motion.div layoutId="navbar-indicator" className="absolute inset-0 bg-white/5 rounded-lg border border-white/10" />
              )}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {(!isLoaded || !userId) ? (
            <div className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <SignInButton mode="modal" />
            </div>
          ) : (
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border-2 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:border-indigo-400 transition-colors"
                }
              }}
            />
          )}
        </div>
      </div>
    </nav>
  );
}
