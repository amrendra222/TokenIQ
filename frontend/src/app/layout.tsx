import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Delta AI Trading',
  description: 'AI-powered Algorithmic Crypto Trading Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased min-h-screen bg-[#0a0a0f] text-white">
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
