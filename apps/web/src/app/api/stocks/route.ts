import { NextResponse } from "next/server";

export const revalidate = 10; // Cache for 10 seconds

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// Fallback values in case Yahoo Finance API is rate-limited or fails.
const MOCK_DATA = {
  sensex: {
    basePrice: 73918.76,
    prevClose: 73524.26,
    baseHigh: 74035.41,
    baseLow: 73426.18,
  },
  nifty: {
    basePrice: 23242.10,
    prevClose: 23123.00,
    baseHigh: 23279.40,
    baseLow: 23104.45,
  }
};

function getMockedStock(base: typeof MOCK_DATA.sensex) {
  // Add minor random fluctuation (+/- 0.05% of base price)
  const drift = (Math.random() - 0.5) * 0.001 * base.basePrice;
  const price = parseFloat((base.basePrice + drift).toFixed(2));
  const change = parseFloat((price - base.prevClose).toFixed(2));
  const changePercent = parseFloat(((change / base.prevClose) * 100).toFixed(2));
  
  const high = parseFloat(Math.max(base.baseHigh, price).toFixed(2));
  const low = parseFloat(Math.min(base.baseLow, price).toFixed(2));
  
  return {
    price,
    change,
    changePercent,
    high,
    low,
    isMock: true
  };
}

async function fetchIndex(symbol: string, fallbackBase: typeof MOCK_DATA.sensex) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      console.warn(`Yahoo Finance returned status ${res.status} for ${symbol}, using fallback.`);
      return getMockedStock(fallbackBase);
    }

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      console.warn(`No chart result for ${symbol}, using fallback.`);
      return getMockedStock(fallbackBase);
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    const price = meta?.regularMarketPrice ?? quote?.close?.[0] ?? fallbackBase.basePrice;
    const prevClose = meta?.chartPreviousClose ?? fallbackBase.prevClose;
    
    const change = parseFloat((price - prevClose).toFixed(2));
    const changePercent = parseFloat(((change / prevClose) * 100).toFixed(2));
    
    const high = meta?.regularMarketDayHigh ?? quote?.high?.[0] ?? Math.max(fallbackBase.baseHigh, price);
    const low = meta?.regularMarketDayLow ?? quote?.low?.[0] ?? Math.min(fallbackBase.baseLow, price);

    return {
      price: parseFloat(price.toFixed(2)),
      change,
      changePercent,
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      isMock: false
    };
  } catch (err) {
    console.error(`Error fetching index ${symbol}:`, err);
    return getMockedStock(fallbackBase);
  }
}

export async function GET() {
  const sensexPromise = fetchIndex("^BSESN", MOCK_DATA.sensex);
  const niftyPromise = fetchIndex("^NSEI", MOCK_DATA.nifty);

  const [sensex, nifty] = await Promise.all([sensexPromise, niftyPromise]);

  return NextResponse.json({
    success: true,
    data: {
      sensex,
      nifty
    }
  });
}
