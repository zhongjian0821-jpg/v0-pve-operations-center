export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount, toAddress } = body;

    if (!walletAddress || !amount || !toAddress) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查余额
    const balanceResult = await query(
      `SELECT ashva_balance, pending_withdrawal FROM wallets
      WHERE LOWER(wallet_address) = LOWER($1)`,
      [walletAddress]
    );

    if (balanceResult.length === 0) {
      return NextResponse.json(
        { success: false, error: '钱包不存在' },
        { status: 404 }
      );
    }

    const balance = parseFloat(balanceResult[0].ashva_balance || '0');
    const pending = parseFloat(balanceResult[0].pending_withdrawal || '0');
    const available = balance - pending;

    if (available < amount) {
      return NextResponse.json(
        { success: false, error: '余额不足' },
        { status: 400 }
      );
    }

    // 创建提现记录
    const withdrawalId = `WD-${Date.now()}`;
    await query(
      `INSERT INTO withdrawals (
        withdrawal_id, wallet_address, amount, to_address, status
      ) VALUES ($1, $2, $3, $4, $5)`,
      [withdrawalId, walletAddress, amount, toAddress, 'pending']
    );

    // 更新待提现金额
    await query(
      `UPDATE wallets
      SET pending_withdrawal = pending_withdrawal + $1
      WHERE LOWER(wallet_address) = LOWER($2)`,
      [amount, walletAddress]
    );

    return NextResponse.json({
      success: true,
      data: {
        withdrawalId: withdrawalId,
        amount: amount,
        status: 'pending'
      }
    });

  } catch (error: any) {
    console.error('[API] 提现申请失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
