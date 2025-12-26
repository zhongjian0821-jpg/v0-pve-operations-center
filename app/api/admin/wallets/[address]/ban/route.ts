// app/api/admin/wallets/[address]/ban/route.ts
// 封禁/解封会员 API

import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { authenticateAdmin, getClientIP, getUserAgent } from '@/lib/auth'
import { apiSuccess, unauthorized, notFound, internalError, validationError } from '@/lib/api-utils'
import { logWalletAction, LogActions } from '@/lib/logs'

export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const admin = await authenticateAdmin(request)
    const { address } = params
    const body = await request.json()
    const { status, reason } = body

    // 验证输入
    if (!status || !['active', 'banned'].includes(status)) {
      return validationError('Status must be either "active" or "banned"')
    }

    if (status === 'banned' && !reason) {
      return validationError('Reason is required when banning a wallet')
    }

    // 验证钱包是否存在
    const walletCheck = await sql(
      `SELECT wallet_address, status FROM wallets WHERE wallet_address = $1`,
      [address]
    )

    if (walletCheck.length === 0) {
      return notFound('Wallet')
    }

    const currentStatus = walletCheck[0].status

    // 检查是否已经是目标状态
    if (currentStatus === status) {
      return validationError(`Wallet is already ${status}`)
    }

    // 更新状态
    const result = await sql(
      `UPDATE wallets 
       SET status = $1, 
           notes = CASE 
             WHEN $2 IS NOT NULL THEN COALESCE(notes, '') || E'\n[' || CURRENT_TIMESTAMP || '] ' || $2
             ELSE notes
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE wallet_address = $3
       RETURNING *`,
      [status, reason, address]
    )

    // 记录操作
    const action = status === 'banned' ? LogActions.WALLET_BAN : LogActions.WALLET_UNBAN
    await logWalletAction(
      admin.id,
      action,
      address,
      {
        previous_status: currentStatus,
        new_status: status,
        reason
      },
      getClientIP(request),
      getUserAgent(request)
    )

    const message = status === 'banned' 
      ? 'Wallet banned successfully' 
      : 'Wallet unbanned successfully'

    return apiSuccess(result[0], message)
  } catch (error: any) {
    console.error('Ban/Unban wallet error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to update wallet status')
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
