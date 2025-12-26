// app/api/admin/withdrawals/[id]/reject/route.ts
// 拒绝提现 API

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
    const { rejected_reason, admin_notes } = body

    // 验证输入
    if (!rejected_reason) {
      return validationError('Rejection reason is required')
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
      return validationError(`Cannot reject withdrawal with status: ${withdrawal.status}`)
    }

    // 开始事务：更新提现记录和恢复钱包余额
    try {
      // 更新提现记录
      await sql(
        `UPDATE withdrawal_records 
         SET status = 'rejected',
             rejected_reason = $1,
             admin_id = $2,
             admin_notes = $3,
             reviewed_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [rejected_reason, admin.id, admin_notes, id]
      )

      // 恢复钱包余额（如果申请时扣除了）
      await sql(
        `UPDATE wallets 
         SET pending_withdrawal = pending_withdrawal - $1,
             ashva_balance = ashva_balance + $1
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
        LogActions.WITHDRAWAL_REJECT,
        id,
        {
          amount: withdrawal.amount,
          wallet_address: withdrawal.wallet_address,
          rejected_reason,
          admin_notes
        },
        getClientIP(request),
        getUserAgent(request)
      )

      return apiSuccess(updatedResult[0], 'Withdrawal rejected successfully')
    } catch (dbError: any) {
      console.error('Transaction error:', dbError)
      throw dbError
    }
  } catch (error: any) {
    console.error('Reject withdrawal error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to reject withdrawal')
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
