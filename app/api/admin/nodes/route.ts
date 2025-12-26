// app/api/admin/nodes/route.ts
// 节点列表 API

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
    const nodeType = searchParams.get('node_type')
    const status = searchParams.get('status')
    const walletAddress = searchParams.get('wallet_address')
    const search = searchParams.get('search') // 搜索 node_id 或 device_serial

    // 构建查询条件
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (nodeType) {
      conditions.push(`n.node_type = $${paramIndex++}`)
      params.push(nodeType)
    }

    if (status) {
      conditions.push(`n.status = $${paramIndex++}`)
      params.push(status)
    }

    if (walletAddress) {
      conditions.push(`n.wallet_address = $${paramIndex++}`)
      params.push(walletAddress)
    }

    if (search) {
      conditions.push(`(
        n.node_id ILIKE $${paramIndex} OR
        n.device_serial ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 获取总数
    const countQuery = `SELECT COUNT(*) as count FROM nodes n ${whereClause}`
    const countResult = await sql(countQuery, params)
    const total = Number(countResult[0]?.count || 0)

    // 获取数据
    const offset = (page - 1) * pageSize
    const dataQuery = `
      SELECT 
        n.*,
        w.wallet_address as owner_address,
        w.username as owner_username,
        w.member_level as owner_level,
        COALESCE(ar.daily_income_count, 0) as income_record_count
      FROM nodes n
      LEFT JOIN wallets w ON n.wallet_address = w.wallet_address
      LEFT JOIN (
        SELECT device_id, COUNT(*) as daily_income_count
        FROM assigned_records
        GROUP BY device_id
      ) ar ON n.node_id = ar.device_id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    const nodes = await sql(dataQuery, [...params, pageSize, offset])

    return apiSuccess({
      data: nodes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error: any) {
    console.error('Get nodes error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to get nodes')
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
