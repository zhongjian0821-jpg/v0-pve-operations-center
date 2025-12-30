import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(message: string, status = 500, details?: any) {
  console.error(`[PVE Withdrawals API] Error: ${message}`, details);
  return NextResponse.json({ success: false, error: message, details }, { status });
}

// GET - 查询提现记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // 构建 WHERE 条件
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause = `WHERE status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    // 查询提现记录
    const recordsQuery = `
      SELECT * FROM withdrawal_records 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    
    const records = await sql(recordsQuery, params);
    
    // 统计数据 - 只使用存在的字段
    const statsQuery = `
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
      FROM withdrawal_records
      ${whereClause}
    `;
    
    const statsParams = params.slice(0, paramIndex - 1);
    const stats = await sql(statsQuery, statsParams.length > 0 ? statsParams : []);
    
    return successResponse({
      records,
      stats: stats[0],
      pagination: {
        limit,
        offset,
        total: parseInt(stats[0].total_count)
      }
    });
    
  } catch (error: any) {
    console.error('[PVE Withdrawals API] GET error:', error);
    return errorResponse(error.message, 500);
  }
}

// POST - 创建提现申请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, amount } = body;
    
    if (!wallet_address || !amount) {
      return errorResponse('缺少必要参数: wallet_address, amount', 400);
    }
    
    if (amount <= 0) {
      return errorResponse('提现金额必须大于0', 400);
    }
    
    // 获取用户当前余额
    const walletQuery = `
      SELECT total_earnings 
      FROM wallets 
      WHERE LOWER(wallet_address) = LOWER($1)
    `;
    
    const wallets = await sql(walletQuery, [wallet_address]);
    
    if (wallets.length === 0) {
      return errorResponse('钱包不存在', 404);
    }
    
    const wallet = wallets[0];
    const currentEarnings = parseFloat(wallet.total_earnings);
    
    if (currentEarnings < amount) {
      return errorResponse('可提现余额不足', 400, {
        available: currentEarnings,
        requested: amount
      });
    }
    
    // 创建提现记录 - 只使用存在的字段
    const insertQuery = `
      INSERT INTO withdrawal_records (
        wallet_address,
        amount,
        status,
        created_at
      ) VALUES (
        $1, $2, 'pending', NOW()
      )
      RETURNING *
    `;
    
    const result = await sql(insertQuery, [
      wallet_address.toLowerCase(),
      amount
    ]);
    
    // 扣除用户余额
    const updateQuery = `
      UPDATE wallets 
      SET total_earnings = total_earnings - $1,
          updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER($2)
    `;
    
    await sql(updateQuery, [amount, wallet_address]);
    
    console.log('[PVE] Withdrawal created:', result[0].id);
    
    return successResponse({
      message: `提现申请已提交，金额 ${amount} ASHVA`,
      withdrawal: result[0]
    }, 201);
    
  } catch (error: any) {
    console.error('[PVE Withdrawals API] POST error:', error);
    return errorResponse(error.message, 500);
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
    
    // 获取提现记录
    const getQuery = `SELECT * FROM withdrawal_records WHERE id = $1`;
    const records = await sql(getQuery, [id]);
    
    if (records.length === 0) {
      return errorResponse('提现记录不存在', 404);
    }
    
    const record = records[0];
    
    // 更新提现记录 - 只使用存在的字段
    const updateQuery = `
      UPDATE withdrawal_records 
      SET status = $1,
          tx_hash = $2,
          reject_reason = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await sql(updateQuery, [
      status,
      tx_hash || null,
      reject_reason || null,
      id
    ]);
    
    // 如果是拒绝状态，退回用户余额
    if (status === 'rejected') {
      const refundQuery = `
        UPDATE wallets 
        SET total_earnings = total_earnings + $1,
            updated_at = NOW()
        WHERE LOWER(wallet_address) = LOWER($2)
      `;
      
      await sql(refundQuery, [parseFloat(record.amount), record.wallet_address]);
      
      console.log('[PVE] Withdrawal rejected and refunded:', id);
    } else {
      console.log('[PVE] Withdrawal updated:', id, 'status:', status);
    }
    
    return successResponse({
      message: '提现状态更新成功',
      withdrawal: result[0]
    });
    
  } catch (error: any) {
    console.error('[PVE Withdrawals API] PUT error:', error);
    return errorResponse(error.message, 500);
  }
}
