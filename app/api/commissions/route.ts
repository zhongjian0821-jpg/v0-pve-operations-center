// app/api/commissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!address) {
      return NextResponse.json({ success: false, error: '缺少钱包地址' }, { status: 400 });
    }

    const commissions = await query(`
      SELECT * FROM commissions
      WHERE LOWER(wallet_address) = LOWER($1)
      ORDER BY created_at DESC
      LIMIT $2
    `, [address, limit]);

    const total = await query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM commissions
      WHERE LOWER(wallet_address) = LOWER($1)
    `, [address]);

    return NextResponse.json({
      success: true,
      data: {
        commissions,
        total: parseFloat(total[0].total)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}