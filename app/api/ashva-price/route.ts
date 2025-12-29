// app/api/ashva-price/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      'https://api.dexscreener.com/latest/dex/tokens/0xea75cb12bbe6232eb082b365f450d3fe06d02fb3'
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.pairs && data.pairs.length > 0) {
        const price = parseFloat(data.pairs[0].priceUsd);
        return NextResponse.json({
          success: true,
          data: {
            price,
            priceFormatted: `$${price.toFixed(8)}`,
            source: 'dexscreener',
            timestamp: new Date().toISOString()
          }
        });
      }
    }
    
    const defaultPrice = parseFloat(process.env.NEXT_PUBLIC_ASHVA_PRICE || '0.00008291');
    return NextResponse.json({
      success: true,
      data: {
        price: defaultPrice,
        priceFormatted: `$${defaultPrice.toFixed(8)}`,
        source: 'default',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}