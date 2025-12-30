export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

// 最低提现金额 10 USD
const MIN_WITHDRAW_USD = 10;

// GET - 查询提现记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    let query;
    let countQuery;
    
    if (walletAddress) {
      // 查询特定钱包的提现记录
      query = sql`
        SELECT 
          w.*,
          wa.member_level,
          wa.ashva_balance
        FROM withdrawal_records w
        LEFT JOIN wallets wa ON LOWER(w.wallet_address) = LOWER(wa.wallet_address)
        WHERE LOWER(w.wallet_address) = LOWER(${walletAddress})
        ${status ? sql`AND w.status = ${status}` : sql``}
        ORDER BY w.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      countQuery = sql`
        SELECT COUNT(*) as count 
        FROM withdrawal_records 
        WHERE LOWER(wallet_address) = LOWER(${walletAddress})
        ${status ? sql`AND status = ${status}` : sql``}
      `;
    } else {
      // 查询所有提现记录（管理员视图）
      query = sql`
        SELECT 
          w.*,
          wa.member_level
        FROM withdrawal_records w
        LEFT JOIN wallets wa ON LOWER(w.wallet_address) = LOWER(wa.wallet_address)
        ${status ? sql`WHERE w.status = ${status}` : sql``}
        ORDER BY w.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      countQuery = sql`
        SELECT COUNT(*) as count 
        FROM withdrawal_records
        ${status ? sql`WHERE status = ${status}` : sql``}
      `;
    }
    
    const [records, countResult] = await Promise.all([query, countQuery]);
    const totalCount = parseInt(countResult[0].count);
    
    // 统计数据
    const stats = await sql`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(actual_amount), 0) as total_actual_amount,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_count
      FROM withdrawal_records
      ${walletAddress ? sql`WHERE LOWER(wallet_address) = LOWER(${walletAddress})` : sql``}
    `;
    
    // 如果查询特定钱包，返回可提现余额
    let availableBalance = 0;
    if (walletAddress) {
      const walletResult = await sql`
        SELECT total_earnings 
        FROM wallets 
        WHERE LOWER(wallet_address) = LOWER(${walletAddress})
      `;
      availableBalance = walletResult.length > 0 
        ? parseFloat(walletResult[0].total_earnings) || 0 
        : 0;
    }
    
    return successResponse({
      records: records,
      stats: stats[0],
      availableBalance: availableBalance,
      minWithdrawUSD: MIN_WITHDRAW_USD,
      pagination: {
        page: page,
        limit: limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error: any) {
    console.error('Get withdrawals error:', error);
    return errorResponse(error.message, 500);
  }
}

// POST - 创建提现申请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, amount, ashva_price, burn_rate = 0 } = body;
    
    console.log('[PVE] Withdraw request:', { wallet_address, amount, ashva_price, burn_rate });
    
    if (!wallet_address || !amount || !ashva_price) {
      return errorResponse('缺少必要参数: wallet_address, amount, ashva_price', 400);
    }
    
    // 计算 USD 价值
    const amountUSD = amount * ashva_price;
    
    // 检查最低提现金额
    if (amountUSD < MIN_WITHDRAW_USD) {
      return errorResponse(`提现金额不足，最低提现金额为 $${MIN_WITHDRAW_USD} USD`, 400);
    }
    
    // 计算燃烧和实际到账金额
    const burnAmount = amount * burn_rate;
    const actualAmount = amount - burnAmount;
    
    console.log('[PVE] Burn calculation:', {
      originalAmount: amount,
      burnRate: `${(burn_rate * 100).toFixed(1)}%`,
      burnAmount,
      actualAmount
    });
    
    // 检查用户余额
    const walletResult = await sql`
      SELECT total_earnings 
      FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${wallet_address})
    `;
    
    if (walletResult.length === 0) {
      return errorResponse('钱包不存在', 404);
    }
    
    const currentEarnings = parseFloat(walletResult[0].total_earnings) || 0;
    
    if (currentEarnings < amount) {
      return errorResponse('可提现余额不足', 400, {
        available: currentEarnings,
        requested: amount
      });
    }
    
    // 创建提现记录
    const withdrawResult = await sql`
      INSERT INTO withdrawal_records (
        wallet_address,
        amount,
        amount_usd,
        burn_rate,
        burn_amount,
        actual_amount,
        status,
        created_at
      ) VALUES (
        ${wallet_address.toLowerCase()},
        ${amount},
        ${amountUSD},
        ${burn_rate},
        ${burnAmount},
        ${actualAmount},
        'pending',
        NOW()
      )
      RETURNING *
    `;
    
    // 扣除用户余额
    await sql`
      UPDATE wallets 
      SET total_earnings = total_earnings - ${amount},
          updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER(${wallet_address})
    `;
    
    console.log('[PVE] Withdrawal created:', withdrawResult[0].id);
    
    return successResponse({
      message: `提现申请已提交，实际到账 ${actualAmount.toFixed(2)} ASHVA（燃烧 ${burnAmount.toFixed(2)} ASHVA），预计24-48小时内处理完成。`,
      withdrawal: withdrawResult[0],
      amount: amount,
      amountUSD: amountUSD,
      burnRate: burn_rate,
      burnAmount: burnAmount,
      actualAmount: actualAmount
    }, 201);
    
  } catch (error: any) {
    console.error('[PVE] Withdraw error:', error);
    return errorResponse('提现失败，请重试', 500);
  }
}

// PUT - 更新提现状态（管理员操作）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, tx_hash, reject_reason } = body;
    
    if (!id || !status) {
      return errorResponse('缺少必要参数: id, status', 400);
    }
    
    // 验证状态
    const validStatuses = ['pending', 'processing', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return errorResponse('无效的状态值', 400);
    }
    
    const updates: any = {
      status: status,
      updated_at: sql`NOW()`
    };
    
    // 如果是完成状态，记录交易哈希和处理时间
    if (status === 'completed') {
      updates.processed_at = sql`NOW()`;
      if (tx_hash) {
        updates.tx_hash = tx_hash;
      }
    }
    
    // 如果是拒绝状态，记录拒绝原因并退回余额
    if (status === 'rejected') {
      updates.processed_at = sql`NOW()`;
      if (reject_reason) {
        updates.reject_reason = reject_reason;
      }
      
      // 获取提现记录
      const record = await sql`
        SELECT wallet_address, amount 
        FROM withdrawal_records 
        WHERE id = ${id}
      `;
      
      if (record.length > 0) {
        // 退回余额
        await sql`
          UPDATE wallets 
          SET total_earnings = total_earnings + ${record[0].amount},
              updated_at = NOW()
          WHERE LOWER(wallet_address) = LOWER(${record[0].wallet_address})
        `;
      }
    }
    
    const updated = await sql`
      UPDATE withdrawal_records
      SET ${sql(updates)}
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (updated.length === 0) {
      return errorResponse('提现记录不存在', 404);
    }
    
    return successResponse({
      message: '提现状态更新成功',
      withdrawal: updated[0]
    });
    
  } catch (error: any) {
    console.error('[PVE] Update withdrawal error:', error);
    return errorResponse(error.message, 500);
  }
}
