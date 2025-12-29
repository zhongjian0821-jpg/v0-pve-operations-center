export const dynamic = 'force-dynamic';

import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址参数' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT 
        id,
        wallet_address,
        from_wallet,
        amount,
        commission_level,
        transaction_type,
        created_at
      FROM commission_records
      WHERE LOWER(wallet_address) = LOWER($1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [address, limit, offset]
    );

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) as total
      FROM commission_records
      WHERE LOWER(wallet_address) = LOWER($1)`,
      [address]
    );

    const commissions = result.map((c: any) => ({
      id: c.id,
      walletAddress: c.wallet_address,
      fromWallet: c.from_wallet,
      amount: parseFloat(c.amount || '0'),
      level: c.commission_level,
      type: c.transaction_type,
      date: c.created_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        total: parseInt(countResult[0]?.total || '0'),
        commissions: commissions
      }
    });

  } catch (error: any) {
    console.error('[API] 佣金记录查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
