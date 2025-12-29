export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT * FROM withdrawals
      WHERE LOWER(wallet_address) = LOWER($1)
      ORDER BY created_at DESC
      LIMIT $2`,
      [address, limit]
    );

    return NextResponse.json({
      success: true,
      data: { total: result.length, withdrawals: result }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
