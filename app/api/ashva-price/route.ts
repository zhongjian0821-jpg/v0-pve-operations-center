export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

async function fetchAshvaPrice() {
  try {
    const response = await fetch(
      'https://api.dexscreener.com/latest/dex/tokens/0xea75cb12bbe6232eb082b365f450d3fe06d02fb3',
      { next: { revalidate: 60 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0];
        return {
          priceUSD: parseFloat(pair.priceUsd),
          priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
          volume24h: parseFloat(pair.volume?.h24 || '0'),
          liquidity: parseFloat(pair.liquidity?.usd || '0'),
          marketCap: parseFloat(pair.marketCap || '0'),
          lastUpdated: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    console.error('获取ASHVA价格失败:', error);
  }
  
  return {
    priceUSD: parseFloat(process.env.NEXT_PUBLIC_ASHVA_PRICE || '0.00008291'),
    priceChange24h: 0,
    volume24h: 0,
    liquidity: 0,
    marketCap: 0,
    lastUpdated: new Date().toISOString()
  };
}

export async function GET() {
  try {
    const priceData = await fetchAshvaPrice();

    return NextResponse.json({
      success: true,
      data: priceData
    });

  } catch (error: any) {
    console.error('[API] ASHVA价格查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
