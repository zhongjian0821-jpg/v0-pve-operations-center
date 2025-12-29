// app/api/hierarchy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ success: false, error: '缺少钱包地址' }, { status: 400 });
    }

    const hierarchy = await query(`
      SELECT * FROM hierarchy
      WHERE LOWER(parent_wallet) = LOWER($1)
      ORDER BY level, created_at
    `, [address]);

    return NextResponse.json({
      success: true,
      data: { hierarchy }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}