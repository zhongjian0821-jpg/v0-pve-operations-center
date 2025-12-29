import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // 总收入（订单）
    const revenue = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as order_count
      FROM orders
      WHERE status = 'completed'
    `

    // 总提现
    const withdrawals = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as withdrawal_count,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
      FROM withdrawals
    `

    // 本月收入
    const monthlyRevenue = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM orders
      WHERE status = 'completed'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `

    // 本月提现
    const monthlyWithdrawals = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM withdrawals
      WHERE status = 'approved'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `

    // 今日数据
    const today = await sql`
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM orders 
         WHERE status = 'completed' AND created_at >= CURRENT_DATE) as revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals 
         WHERE status = 'approved' AND created_at >= CURRENT_DATE) as withdrawals
    `

    const totalRevenue = parseFloat(revenue[0]?.total || 0)
    const totalWithdrawals = parseFloat(withdrawals[0]?.total || 0)

    return NextResponse.json({
      success: true,
      data: {
        total: {
          revenue: totalRevenue,
          revenue_count: revenue[0]?.order_count || 0,
          withdrawals: totalWithdrawals,
          withdrawals_count: withdrawals[0]?.withdrawal_count || 0,
          pending_withdrawals: parseFloat(withdrawals[0]?.pending_amount || 0),
          profit: totalRevenue - totalWithdrawals
        },
        monthly: {
          revenue: parseFloat(monthlyRevenue[0]?.total || 0),
          withdrawals: parseFloat(monthlyWithdrawals[0]?.total || 0)
        },
        today: {
          revenue: parseFloat(today[0]?.revenue || 0),
          withdrawals: parseFloat(today[0]?.withdrawals || 0)
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
