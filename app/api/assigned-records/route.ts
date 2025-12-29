// app/api/assigned-records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    const records = await query(`
      SELECT * FROM assigned_records
      WHERE LOWER(wallet_address) = LOWER($1)
      ORDER BY record_date DESC
      LIMIT $2
    `, [address, limit]);

    return NextResponse.json({
      success: true,
      data: { records }
    });

  } catch (error: any) {
    console.error('[API] 查询分配记录失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
