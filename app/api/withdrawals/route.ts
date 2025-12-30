export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

const MIN_WITHDRAW_USD = 10;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    let records;
    let countResult;
    
    if (walletAddress) {
      if (status) {
        records = await sql`
          SELECT w.*, wa.member_level, wa.ashva_balance
          FROM withdrawal_records w
          LEFT JOIN wallets wa ON LOWER(w.wallet_address) = LOWER(wa.wallet_address)
          WHERE LOWER(w.wallet_address) = LOWER(${walletAddress}) AND w.status = ${status}
          ORDER BY w.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`
          SELECT COUNT(*) as count FROM withdrawal_records 
          WHERE LOWER(wallet_address) = LOWER(${walletAddress}) AND status = ${status}
        `;
      } else {
        records = await sql`
          SELECT w.*, wa.member_level, wa.ashva_balance
          FROM withdrawal_records w
          LEFT JOIN wallets wa ON LOWER(w.wallet_address) = LOWER(wa.wallet_address)
          WHERE LOWER(w.wallet_address) = LOWER(${walletAddress})
          ORDER BY w.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`
          SELECT COUNT(*) as count FROM withdrawal_records 
          WHERE LOWER(wallet_address) = LOWER(${walletAddress})
        `;
      }
    } else {
      if (status) {
        records = await sql`
          SELECT w.*, wa.member_level
          FROM withdrawal_records w
          LEFT JOIN wallets wa ON LOWER(w.wallet_address) = LOWER(wa.wallet_address)
          WHERE w.status = ${status}
          ORDER BY w.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`
          SELECT COUNT(*) as count FROM withdrawal_records WHERE status = ${status}
        `;
      } else {
        records = await sql`
          SELECT w.*, wa.member_level
          FROM withdrawal_records w
          LEFT JOIN wallets wa ON LOWER(w.wallet_address) = LOWER(wa.wallet_address)
          ORDER BY w.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`SELECT COUNT(*) as count FROM withdrawal_records`;
      }
    }
    
    const totalCount = parseInt(countResult[0].count);
    
    const statsQuery = walletAddress 
      ? sql`
          SELECT 
            COUNT(*) as total_count,
            COALESCE(SUM(amount), 0) as total_amount,
            COALESCE(SUM(actual_amount), 0) as total_actual_amount,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
            COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
            COUNT(*) FILTER (WHERE status = 'processing') as processing_count
          FROM withdrawal_records
          WHERE LOWER(wallet_address) = LOWER(${walletAddress})
        `
      : sql`
          SELECT 
            COUNT(*) as total_count,
            COALESCE(SUM(amount), 0) as total_amount,
            COALESCE(SUM(actual_amount), 0) as total_actual_amount,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
            COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
            COUNT(*) FILTER (WHERE status = 'processing') as processing_count
          FROM withdrawal_records
        `;
    
    const stats = await statsQuery;
    
    let availableBalance = 0;
    if (walletAddress) {
      const walletResult = await sql`
        SELECT total_earnings FROM wallets 
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, amount, ashva_price, burn_rate = 0 } = body;
    
    if (!wallet_address || !amount || !ashva_price) {
      return errorResponse('缺少必要参数', 400);
    }
    
    const amountUSD = amount * ashva_price;
    
    if (amountUSD < MIN_WITHDRAW_USD) {
      return errorResponse(`提现金额不足，最低 $${MIN_WITHDRAW_USD} USD`, 400);
    }
    
    const burnAmount = amount * burn_rate;
    const actualAmount = amount - burnAmount;
    
    const walletResult = await sql`
      SELECT total_earnings FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${wallet_address})
    `;
    
    if (walletResult.length === 0) {
      return errorResponse('钱包不存在', 404);
    }
    
    const currentEarnings = parseFloat(walletResult[0].total_earnings) || 0;
    
    if (currentEarnings < amount) {
      return errorResponse('余额不足', 400);
    }
    
    const withdrawResult = await sql`
      INSERT INTO withdrawal_records (
        wallet_address, amount, amount_usd, burn_rate, 
        burn_amount, actual_amount, status, created_at
      ) VALUES (
        ${wallet_address.toLowerCase()}, ${amount}, ${amountUSD}, 
        ${burn_rate}, ${burnAmount}, ${actualAmount}, 'pending', NOW()
      )
      RETURNING *
    `;
    
    await sql`
      UPDATE wallets 
      SET total_earnings = total_earnings - ${amount}, updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER(${wallet_address})
    `;
    
    return successResponse({
      message: `提现申请已提交，实际到账 ${actualAmount.toFixed(2)} ASHVA`,
      withdrawal: withdrawResult[0]
    }, 201);
    
  } catch (error: any) {
    console.error('Withdraw error:', error);
    return errorResponse('提现失败', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, tx_hash, reject_reason } = body;
    
    if (!id || !status) {
      return errorResponse('缺少参数', 400);
    }
    
    const validStatuses = ['pending', 'processing', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return errorResponse('无效状态', 400);
    }
    
    const updateData: any = {};
    
    if (status === 'completed') {
      const updates = await sql`
        UPDATE withdrawal_records
        SET status = 'completed', 
            processed_at = NOW(),
            tx_hash = ${tx_hash || null},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (updates.length === 0) {
        return errorResponse('记录不存在', 404);
      }
      
      return successResponse({
        message: '已批准',
        withdrawal: updates[0]
      });
    }
    
    if (status === 'rejected') {
      const record = await sql`
        SELECT wallet_address, amount FROM withdrawal_records WHERE id = ${id}
      `;
      
      if (record.length === 0) {
        return errorResponse('记录不存在', 404);
      }
      
      await sql`
        UPDATE wallets 
        SET total_earnings = total_earnings + ${record[0].amount}, updated_at = NOW()
        WHERE LOWER(wallet_address) = LOWER(${record[0].wallet_address})
      `;
      
      const updates = await sql`
        UPDATE withdrawal_records
        SET status = 'rejected',
            processed_at = NOW(),
            reject_reason = ${reject_reason || null},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      return successResponse({
        message: '已拒绝并退款',
        withdrawal: updates[0]
      });
    }
    
    const updates = await sql`
      UPDATE withdrawal_records
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (updates.length === 0) {
      return errorResponse('记录不存在', 404);
    }
    
    return successResponse({
      message: '状态已更新',
      withdrawal: updates[0]
    });
    
  } catch (error: any) {
    console.error('Update error:', error);
    return errorResponse(error.message, 500);
  }
}
