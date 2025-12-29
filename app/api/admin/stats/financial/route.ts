import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // 总收入（订单）
    const revenue = await sql`
      SELECT 
        SUM(price) as total,
        COUNT(*) as order_count
      FROM orders
      WHERE status = 'completed'
    `

    // 总提现
    const withdrawals = await sql`
      SELECT 
        SUM(amount) as total,
        COUNT(*) as withdrawal_count,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
      FROM withdrawals
    `

    // 本月收入
    const monthlyRevenue = await sql`
      SELECT SUM(price) as total
      FROM orders
      WHERE status = 'completed'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `

    // 本月提现
    const monthlyWithdrawals = await sql`
      SELECT SUM(amount) as total
      FROM withdrawals
      WHERE status = 'approved'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `

    // 今日数据
    const today = await sql`
      SELECT 
        (SELECT SUM(price) FROM orders 
         WHERE status = 'completed' AND created_at >= CURRENT_DATE) as revenue,
        (SELECT SUM(amount) FROM withdrawals 
         WHERE status = 'approved' AND created_at >= CURRENT_DATE) as withdrawals
    `

    return NextResponse.json({
      success: true,
      data: {
        total: {
          revenue: revenue[0],
          withdrawals: withdrawals[0],
          profit: parseFloat(revenue[0]?.total || 0) - parseFloat(withdrawals[0]?.total || 0)
        },
        monthly: {
          revenue: monthlyRevenue[0]?.total || 0,
          withdrawals: monthlyWithdrawals[0]?.total || 0
        },
        today: today[0],
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
