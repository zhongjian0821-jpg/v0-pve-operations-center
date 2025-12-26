// app/api/admin/wallets/route.ts
// 钱包列表 API

import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { authenticateAdmin } from '@/lib/auth'
import { apiSuccess, unauthorized, internalError, parsePaginationParams } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    await authenticateAdmin(request)

    const { searchParams } = new URL(request.url)
    const { page, pageSize } = parsePaginationParams(searchParams)
    
    // 筛选参数
    const status = searchParams.get('status')
    const memberLevel = searchParams.get('memberLevel')
    const search = searchParams.get('search') // 搜索钱包地址、用户名或邮箱

    // 构建查询条件
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (status) {
      conditions.push(`w.status = $${paramIndex++}`)
      params.push(status)
    }

    if (memberLevel) {
      conditions.push(`w.member_level = $${paramIndex++}`)
      params.push(memberLevel)
    }

    if (search) {
      conditions.push(`(
        w.wallet_address ILIKE $${paramIndex} OR
        w.username ILIKE $${paramIndex} OR
        w.email ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 获取总数
    const countQuery = `SELECT COUNT(*) as count FROM wallets w ${whereClause}`
    const countResult = await sql(countQuery, params)
    const total = Number(countResult[0]?.count || 0)

    // 获取数据
    const offset = (page - 1) * pageSize
    const dataQuery = `
      SELECT 
        w.*,
        COUNT(DISTINCT n.id) as node_count,
        COALESCE(SUM(n.total_earnings), 0) as total_node_earnings
      FROM wallets w
      LEFT JOIN nodes n ON w.wallet_address = n.wallet_address
      ${whereClause}
      GROUP BY w.id
      ORDER BY w.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    const wallets = await sql(dataQuery, [...params, pageSize, offset])

    return apiSuccess({
      data: wallets,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error: any) {
    console.error('Get wallets error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to get wallets')
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
