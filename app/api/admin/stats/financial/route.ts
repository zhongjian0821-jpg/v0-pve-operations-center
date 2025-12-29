import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // 只统计数量，不涉及金额字段
    const orders = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM orders
    `

    const withdrawals = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM withdrawals
    `

    // 本月数据
    const monthlyOrders = await sql`
      SELECT COUNT(*) as total
      FROM orders
      WHERE status = 'completed'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `

    const monthlyWithdrawals = await sql`
      SELECT COUNT(*) as total
      FROM withdrawals
      WHERE status = 'approved'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `

    // 今日数据
    const todayOrders = await sql`
      SELECT COUNT(*) as count
      FROM orders
      WHERE status = 'completed' AND created_at >= CURRENT_DATE
    `

    const todayWithdrawals = await sql`
      SELECT COUNT(*) as count
      FROM withdrawals
      WHERE status = 'approved' AND created_at >= CURRENT_DATE
    `

    return NextResponse.json({
      success: true,
      data: {
        total: {
          orders: parseInt(orders[0]?.total || 0),
          orders_completed: parseInt(orders[0]?.completed || 0),
          orders_pending: parseInt(orders[0]?.pending || 0),
          withdrawals: parseInt(withdrawals[0]?.total || 0),
          withdrawals_pending: parseInt(withdrawals[0]?.pending || 0),
          withdrawals_approved: parseInt(withdrawals[0]?.approved || 0),
          withdrawals_rejected: parseInt(withdrawals[0]?.rejected || 0)
        },
        monthly: {
          orders: parseInt(monthlyOrders[0]?.total || 0),
          withdrawals: parseInt(monthlyWithdrawals[0]?.total || 0)
        },
        today: {
          orders: parseInt(todayOrders[0]?.count || 0),
          withdrawals: parseInt(todayWithdrawals[0]?.count || 0)
        },
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Get financial stats error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
