import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeltaAlgo Trader — Algorithmic Crypto Trading Platform",
  description:
    "Monitor real-time crypto market data, configure automated trading strategies, and execute trades on Delta Exchange Testnet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
