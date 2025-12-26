// app/api/admin/withdrawals/route.ts
// 提现列表 API

import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { authenticateAdmin } from '@/lib/auth'
import { apiSuccess, unauthorized, internalError, parsePaginationParams } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    const { searchParams } = new URL(request.url)
    const { page, pageSize } = parsePaginationParams(searchParams)
    
    // 筛选参数
    const status = searchParams.get('status')
    const walletAddress = searchParams.get('wallet_address')

    // 构建查询条件
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (status) {
      conditions.push(`wr.status = $${paramIndex++}`)
      params.push(status)
    }

    if (walletAddress) {
      conditions.push(`wr.wallet_address = $${paramIndex++}`)
      params.push(walletAddress)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 获取总数
    const countQuery = `SELECT COUNT(*) as count FROM withdrawal_records wr ${whereClause}`
    const countResult = await sql(countQuery, params)
    const total = Number(countResult[0]?.count || 0)

    // 获取数据
    const offset = (page - 1) * pageSize
    const dataQuery = `
      SELECT 
        wr.*,
        w.username as user_username,
        w.email as user_email,
        w.member_level,
        a.username as admin_username
      FROM withdrawal_records wr
      LEFT JOIN wallets w ON wr.wallet_address = w.wallet_address
      LEFT JOIN admins a ON wr.admin_id = a.id
      ${whereClause}
      ORDER BY wr.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    const withdrawals = await sql(dataQuery, [...params, pageSize, offset])

    // 统计数据
    const statsResult = await sql(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM withdrawal_records
      GROUP BY status
    `)

    return apiSuccess({
      data: withdrawals,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      },
      stats: statsResult
    })
  } catch (error: any) {
    console.error('Get withdrawals error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to get withdrawals')
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
