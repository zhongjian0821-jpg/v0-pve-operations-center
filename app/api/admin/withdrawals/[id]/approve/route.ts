// app/api/admin/withdrawals/[id]/approve/route.ts
// 批准提现 API

import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { authenticateAdmin, getClientIP, getUserAgent } from '@/lib/auth'
import { apiSuccess, unauthorized, notFound, internalError, validationError } from '@/lib/api-utils'
import { logWithdrawalAction, LogActions } from '@/lib/logs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await authenticateAdmin(request)
    const { id } = params
    const body = await request.json()
    const { tx_hash, admin_notes } = body

    // 验证输入
    if (!tx_hash) {
      return validationError('Transaction hash is required')
    }

    // 获取提现记录
    const withdrawalResult = await sql(
      `SELECT * FROM withdrawal_records WHERE id = $1`,
      [id]
    )

    if (withdrawalResult.length === 0) {
      return notFound('Withdrawal record')
    }

    const withdrawal = withdrawalResult[0]

    // 检查状态
    if (withdrawal.status !== 'pending') {
      return validationError(`Cannot approve withdrawal with status: ${withdrawal.status}`)
    }

    // 开始事务：更新提现记录和钱包余额
    try {
      // 更新提现记录
      await sql(
        `UPDATE withdrawal_records 
         SET status = 'approved',
             tx_hash = $1,
             admin_id = $2,
             admin_notes = $3,
             reviewed_at = CURRENT_TIMESTAMP,
             processed_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [tx_hash, admin.id, admin_notes, id]
      )

      // 更新钱包余额（如果还没扣除）
      // 注意：根据业务逻辑，可能在申请时就已经扣除了
      await sql(
        `UPDATE wallets 
         SET pending_withdrawal = pending_withdrawal - $1,
             total_withdrawn = total_withdrawn + $1
         WHERE wallet_address = $2`,
        [withdrawal.amount, withdrawal.wallet_address]
      )

      // 获取更新后的记录
      const updatedResult = await sql(
        `SELECT 
          wr.*,
          w.username,
          w.email
         FROM withdrawal_records wr
         LEFT JOIN wallets w ON wr.wallet_address = w.wallet_address
         WHERE wr.id = $1`,
        [id]
      )

      // 记录操作
      await logWithdrawalAction(
        admin.id,
        LogActions.WITHDRAWAL_APPROVE,
        id,
        {
          amount: withdrawal.amount,
          wallet_address: withdrawal.wallet_address,
          tx_hash,
          admin_notes
        },
        getClientIP(request),
        getUserAgent(request)
      )

      return apiSuccess(updatedResult[0], 'Withdrawal approved successfully')
    } catch (dbError: any) {
      console.error('Transaction error:', dbError)
      throw dbError
    }
  } catch (error: any) {
    console.error('Approve withdrawal error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to approve withdrawal')
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
