"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockInfo {
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  isMock?: boolean;
}

interface StocksData {
  sensex: StockInfo;
  nifty: StockInfo;
}

export function Footer() {
  const [stocks, setStocks] = useState<StocksData | null>(null);

  useEffect(() => {
    async function fetchStocks() {
      try {
        const res = await fetch("/api/stocks");
        if (res.ok) {
          const payload = await res.json();
          if (payload.success && payload.data) {
            setStocks(payload.data);
          }
        }
      } catch (err) {
        // Suppress standard connection/fetch errors to keep the console clean during dev server reloads
      }
    }

    fetchStocks();
    const interval = setInterval(fetchStocks, 15000); // Polling every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 flex flex-col xl:flex-row items-center justify-between px-4 sm:px-8 py-3 xl:py-0 xl:h-12 shrink-0 z-20 text-[10px] sm:text-[11px] text-slate-500 select-none font-sans gap-3 xl:gap-0">
      {/* Left side: Copyright */}
      <div className="flex items-center gap-1 order-3 xl:order-1 shrink-0">
        <span>© 2026 GenAI Academy & Hub.</span>
      </div>

      {/* Middle: Live Stocks */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 order-1 xl:order-2 text-slate-400 max-w-full overflow-hidden">
        {/* Live Indicator */}
        <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-slate-800">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-extrabold tracking-widest text-emerald-400 uppercase">LIVE</span>
        </div>

        {stocks ? (
          <>
            {/* BSE Sensex */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-bold text-slate-500">BSE SENSEX</span>
              <span className="font-semibold text-slate-200">{stocks.sensex.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              <span className={`flex items-center font-bold text-[9px] ${stocks.sensex.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {stocks.sensex.change >= 0 ? "+" : ""}{stocks.sensex.changePercent}%
                {stocks.sensex.change >= 0 ? (
                  <TrendingUp className="w-2.5 h-2.5 ml-0.5" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 ml-0.5" />
                )}
              </span>
              <span className="text-[9px] text-slate-600 hidden sm:inline">
                (H: <span className="text-slate-500">{stocks.sensex.high.toLocaleString("en-IN")}</span> L: <span className="text-slate-500">{stocks.sensex.low.toLocaleString("en-IN")}</span>)
              </span>
            </div>

            <div className="hidden sm:block w-px h-3 bg-slate-800" />

            {/* NSE Nifty 50 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-bold text-slate-500">NSE NIFTY 50</span>
              <span className="font-semibold text-slate-200">{stocks.nifty.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              <span className={`flex items-center font-bold text-[9px] ${stocks.nifty.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {stocks.nifty.change >= 0 ? "+" : ""}{stocks.nifty.changePercent}%
                {stocks.nifty.change >= 0 ? (
                  <TrendingUp className="w-2.5 h-2.5 ml-0.5" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 ml-0.5" />
                )}
              </span>
              <span className="text-[9px] text-slate-600 hidden sm:inline">
                (H: <span className="text-slate-500">{stocks.nifty.high.toLocaleString("en-IN")}</span> L: <span className="text-slate-500">{stocks.nifty.low.toLocaleString("en-IN")}</span>)
              </span>
            </div>
          </>
        ) : (
          <span className="text-slate-500 animate-pulse text-[10px]">Loading market data...</span>
        )}
      </div>

      {/* Right side: Gateway & version */}
      <div className="flex items-center gap-3 order-2 xl:order-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 font-medium">Gateway: Connected</span>
        </div>
        <div className="w-px h-3 bg-slate-800" />
        <span className="hover:text-slate-400 transition-colors">v1.2.0</span>
      </div>
    </footer>
  );
}
