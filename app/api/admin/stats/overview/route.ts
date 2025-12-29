import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // 机器统计
    const machines = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
        SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline
      FROM machines
    `

    // 节点统计
    const nodes = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
        SUM(CASE WHEN status = 'stopped' THEN 1 ELSE 0 END) as stopped
      FROM nodes
    `

    // 用户统计
    const wallets = await sql`
      SELECT COUNT(DISTINCT wallet_address) as total FROM wallets
    `

    // 提现统计
    const withdrawals = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        COALESCE(SUM(amount), 0) as total_amount
      FROM withdrawals
    `

    // 订单统计
    const orders = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        COALESCE(SUM(amount), 0) as total_revenue
      FROM orders
    `

    return NextResponse.json({
      success: true,
      data: {
        machines: {
          total: machines[0]?.total || 0,
          online: machines[0]?.online || 0,
          offline: machines[0]?.offline || 0
        },
        nodes: {
          total: nodes[0]?.total || 0,
          running: nodes[0]?.running || 0,
          stopped: nodes[0]?.stopped || 0
        },
        users: {
          total: wallets[0]?.total || 0
        },
        withdrawals: {
          total: withdrawals[0]?.total || 0,
          pending: withdrawals[0]?.pending || 0,
          approved: withdrawals[0]?.approved || 0,
          total_amount: parseFloat(withdrawals[0]?.total_amount || 0)
        },
        orders: {
          total: orders[0]?.total || 0,
          completed: orders[0]?.completed || 0,
          total_revenue: parseFloat(orders[0]?.total_revenue || 0)
        },
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Get overview stats error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
