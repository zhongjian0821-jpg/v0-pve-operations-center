// app/api/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    // 查询钱包和层级信息
    const [wallet, upline, downlines] = await Promise.all([
      query(`SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER($1)`, [address]),
      query(`SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER((SELECT parent_wallet FROM wallets WHERE LOWER(wallet_address) = LOWER($1)))`, [address]),
      query(`SELECT * FROM wallets WHERE LOWER(parent_wallet) = LOWER($1) ORDER BY created_at DESC`, [address])
    ]);

    if (wallet.length === 0) {
      return NextResponse.json(
        { success: false, error: '钱包不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        currentUser: wallet[0],
        upline: upline[0] || null,
        downlines: downlines
      }
    });

  } catch (error: any) {
    console.error('[API] 钱包查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
