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
        SUM(amount) as total_amount
      FROM withdrawals
    `

    // 订单统计
    const orders = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(price) as total_revenue
      FROM orders
    `

    return NextResponse.json({
      success: true,
      data: {
        machines: machines[0],
        nodes: nodes[0],
        users: wallets[0],
        withdrawals: withdrawals[0],
        orders: orders[0],
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
