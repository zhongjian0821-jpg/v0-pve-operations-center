// app/api/admin/wallets/[address]/route.ts
// 钱包详情和编辑 API

import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { authenticateAdmin, getClientIP, getUserAgent } from '@/lib/auth'
import { apiSuccess, unauthorized, notFound, internalError, validationError } from '@/lib/api-utils'
import { logWalletAction, LogActions } from '@/lib/logs'

// GET - 获取钱包详情
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const admin = await authenticateAdmin(request)
    const { address } = params

    // 获取钱包基本信息
    const walletResult = await sql(
      `SELECT * FROM wallets WHERE wallet_address = $1`,
      [address]
    )

    if (walletResult.length === 0) {
      return notFound('Wallet')
    }

    const wallet = walletResult[0]

    // 获取节点列表
    const nodes = await sql(
      `SELECT * FROM nodes WHERE wallet_address = $1 ORDER BY created_at DESC`,
      [address]
    )

    // 获取佣金记录
    const commissions = await sql(
      `SELECT * FROM commission_records 
       WHERE wallet_address = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [address]
    )

    // 获取提现记录
    const withdrawals = await sql(
      `SELECT * FROM withdrawal_records 
       WHERE wallet_address = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [address]
    )

    // 获取层级信息
    const hierarchy = await sql(
      `SELECT * FROM hierarchy WHERE wallet_address = $1`,
      [address]
    )

    // 获取团队成员（直接推荐）
    const teamMembers = await sql(
      `SELECT 
        w.wallet_address,
        w.member_level,
        w.created_at,
        COUNT(n.id) as node_count
       FROM wallets w
       LEFT JOIN nodes n ON w.wallet_address = n.wallet_address
       WHERE w.parent_wallet = $1
       GROUP BY w.wallet_address, w.member_level, w.created_at
       ORDER BY w.created_at DESC`,
      [address]
    )

    // 记录查看操作
    await logWalletAction(
      admin.id,
      LogActions.WALLET_VIEW,
      address,
      null,
      getClientIP(request),
      getUserAgent(request)
    )

    return apiSuccess({
      wallet,
      nodes,
      commissions,
      withdrawals,
      hierarchy: hierarchy[0] || null,
      teamMembers
    })
  } catch (error: any) {
    console.error('Get wallet detail error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to get wallet details')
  }
}

// PUT - 编辑钱包信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const admin = await authenticateAdmin(request)
    const { address } = params
    const body = await request.json()

    // 验证钱包是否存在
    const walletCheck = await sql(
      `SELECT wallet_address FROM wallets WHERE wallet_address = $1`,
      [address]
    )

    if (walletCheck.length === 0) {
      return notFound('Wallet')
    }

    // 允许编辑的字段
    const allowedFields = ['email', 'username', 'notes', 'kyc_status']
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`)
        values.push(body[field])
      }
    }

    if (updates.length === 0) {
      return validationError('No valid fields to update')
    }

    // 添加 updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    // 添加 wallet_address 到 values
    values.push(address)

    // 执行更新
    const updateQuery = `
      UPDATE wallets 
      SET ${updates.join(', ')}
      WHERE wallet_address = $${paramIndex}
      RETURNING *
    `

    const result = await sql(updateQuery, values)

    // 记录操作
    await logWalletAction(
      admin.id,
      LogActions.WALLET_EDIT,
      address,
      { updated_fields: Object.keys(body) },
      getClientIP(request),
      getUserAgent(request)
    )

    return apiSuccess(result[0], 'Wallet updated successfully')
  } catch (error: any) {
    console.error('Update wallet error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to update wallet')
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
