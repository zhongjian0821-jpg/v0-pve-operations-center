// app/api/admin/orders/route.ts
// 订单列表 API

import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { authenticateAdmin } from '@/lib/auth'
import { apiSuccess, unauthorized, internalError, parsePaginationParams } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    const { searchParams } = new URL(request.url)
    const { page, pageSize } = parsePaginationParams(searchParams)
    
    const orderType = searchParams.get('order_type')
    const paymentStatus = searchParams.get('payment_status')
    const walletAddress = searchParams.get('wallet_address')

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (orderType) {
      conditions.push(`o.order_type = $${paramIndex++}`)
      params.push(orderType)
    }

    if (paymentStatus) {
      conditions.push(`o.payment_status = $${paramIndex++}`)
      params.push(paymentStatus)
    }

    if (walletAddress) {
      conditions.push(`o.wallet_address = $${paramIndex++}`)
      params.push(walletAddress)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countQuery = `SELECT COUNT(*) as count FROM orders o ${whereClause}`
    const countResult = await sql(countQuery, params)
    const total = Number(countResult[0]?.count || 0)

    const offset = (page - 1) * pageSize
    const dataQuery = `
      SELECT 
        o.*,
        w.username,
        w.email,
        w.member_level
      FROM orders o
      LEFT JOIN wallets w ON o.wallet_address = w.wallet_address
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    const orders = await sql(dataQuery, [...params, pageSize, offset])

    return apiSuccess({
      data: orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error: any) {
    console.error('Get orders error:', error)
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    return internalError('Failed to get orders')
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
