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

    // 钱包统计
    const wallets = await sql`
      SELECT COUNT(DISTINCT wallet_address) as total FROM wallets
    `

    // 提现统计（只统计数量）
    const withdrawals = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
      FROM withdrawals
    `

    // 订单统计（只统计数量）
    const orders = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM orders
    `

    return NextResponse.json({
      success: true,
      data: {
        machines: {
          total: parseInt(machines[0]?.total || 0),
          online: parseInt(machines[0]?.online || 0),
          offline: parseInt(machines[0]?.offline || 0)
        },
        nodes: {
          total: parseInt(nodes[0]?.total || 0),
          running: parseInt(nodes[0]?.running || 0),
          stopped: parseInt(nodes[0]?.stopped || 0)
        },
        users: {
          total: parseInt(wallets[0]?.total || 0)
        },
        withdrawals: {
          total: parseInt(withdrawals[0]?.total || 0),
          pending: parseInt(withdrawals[0]?.pending || 0),
          approved: parseInt(withdrawals[0]?.approved || 0)
        },
        orders: {
          total: parseInt(orders[0]?.total || 0),
          completed: parseInt(orders[0]?.completed || 0)
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
