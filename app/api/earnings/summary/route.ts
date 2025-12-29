export const dynamic = 'force-dynamic';

import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址参数' },
        { status: 400 }
      );
    }

    // 查询节点总收益
    const nodeEarningsResult = await query(
      `SELECT COALESCE(SUM(total_earnings), 0) as total
      FROM nodes
      WHERE LOWER(wallet_address) = LOWER($1)`,
      [address]
    );

    // 查询钱包信息
    const walletResult = await query(
      `SELECT 
        COALESCE(distributable_commission, 0) as distributable,
        COALESCE(distributed_commission, 0) as distributed,
        COALESCE(pending_withdrawal, 0) as pending,
        COALESCE(total_withdrawn, 0) as withdrawn,
        COALESCE(total_earnings, 0) as total_earnings
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER($1)`,
      [address]
    );

    const wallet = walletResult[0] || {};
    const nodeEarnings = parseFloat(nodeEarningsResult[0]?.total || '0');
    const distributableCommission = parseFloat(wallet.distributable || '0');
    const distributedCommission = parseFloat(wallet.distributed || '0');
    const pendingWithdrawal = parseFloat(wallet.pending || '0');
    const totalWithdrawn = parseFloat(wallet.withdrawn || '0');

    const totalCommission = distributableCommission + distributedCommission;
    const totalEarnings = nodeEarnings + totalCommission;
    const availableBalance = totalEarnings - pendingWithdrawal - totalWithdrawn;

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings: totalEarnings,
        nodeEarnings: nodeEarnings,
        commissionEarnings: totalCommission,
        distributableCommission: distributableCommission,
        distributedCommission: distributedCommission,
        pendingWithdrawal: pendingWithdrawal,
        totalWithdrawn: totalWithdrawn,
        availableBalance: Math.max(0, availableBalance)
      }
    });

  } catch (error: any) {
    console.error('[API] 收益汇总查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
