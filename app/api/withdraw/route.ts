// app/api/withdraw/route.ts
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

    const withdrawAmount = parseFloat(amount);
    
    if (withdrawAmount <= 0) {
      return NextResponse.json(
        { success: false, error: '提现金额必须大于0' },
        { status: 400 }
      );
    }

    console.log('[API] 申请提现:', { walletAddress, amount: withdrawAmount, toAddress });

    // 检查钱包余额
    const walletData = await query(`
      SELECT 
        total_earnings,
        pending_withdrawal,
        total_withdrawn,
        ashva_balance
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER($1)
    `, [walletAddress]);

    if (walletData.length === 0) {
      return NextResponse.json(
        { success: false, error: '钱包不存在' },
        { status: 404 }
      );
    }

    const wallet = walletData[0];
    const totalEarnings = parseFloat(wallet.total_earnings || '0');
    const pendingWithdrawal = parseFloat(wallet.pending_withdrawal || '0');
    const totalWithdrawn = parseFloat(wallet.total_withdrawn || '0');
    const availableBalance = totalEarnings - pendingWithdrawal - totalWithdrawn;

    if (withdrawAmount > availableBalance) {
      return NextResponse.json(
        { 
          success: false, 
          error: `余额不足。可用: ${availableBalance.toFixed(2)} ASHVA`
        },
        { status: 400 }
      );
    }

    // 创建提现记录
    const withdrawId = `withdraw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await query(`
      INSERT INTO withdrawals (
        withdrawal_id,
        wallet_address,
        amount,
        to_address,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [withdrawId, walletAddress, withdrawAmount, toAddress, 'pending']);

    // 更新钱包pending_withdrawal
    await query(`
      UPDATE wallets
      SET 
        pending_withdrawal = pending_withdrawal + $1,
        updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER($2)
    `, [withdrawAmount, walletAddress]);

    console.log('[API] 提现申请创建成功:', withdrawId);

    return NextResponse.json({
      success: true,
      data: {
        withdrawalId: withdrawId,
        amount: withdrawAmount,
        amountFormatted: `${withdrawAmount.toFixed(2)} ASHVA`,
        toAddress: toAddress,
        status: 'pending',
        message: '提现申请已提交，等待审核'
      }
    });

  } catch (error: any) {
    console.error('[API] 提现申请失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    // 查询提现记录
    const withdrawals = await query(`
      SELECT 
        withdrawal_id,
        wallet_address,
        amount,
        to_address,
        status,
        tx_hash,
        created_at,
        processed_at
      FROM withdrawals
      WHERE LOWER(wallet_address) = LOWER($1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [address, limit, offset]);

    // 统计
    const stats = await query(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_completed,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending
      FROM withdrawals
      WHERE LOWER(wallet_address) = LOWER($1)
    `, [address]);

    return NextResponse.json({
      success: true,
      data: {
        withdrawals: withdrawals.map((w: any) => ({
          id: w.withdrawal_id,
          amount: parseFloat(w.amount),
          amountFormatted: `${parseFloat(w.amount).toFixed(2)} ASHVA`,
          toAddress: w.to_address,
          status: w.status,
          txHash: w.tx_hash,
          createdAt: w.created_at,
          processedAt: w.processed_at
        })),
        stats: {
          total: parseInt(stats[0].total_count),
          completed: parseFloat(stats[0].total_completed),
          pending: parseFloat(stats[0].total_pending)
        },
        pagination: {
          limit,
          offset
        }
      }
    });

  } catch (error: any) {
    console.error('[API] 查询提现记录失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
