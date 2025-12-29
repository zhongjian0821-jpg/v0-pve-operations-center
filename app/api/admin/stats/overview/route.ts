import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // 只统计各表的记录数量
    const stats = await Promise.all([
      sql`SELECT COUNT(*) as count FROM machines`,
      sql`SELECT COUNT(*) as count FROM nodes`,
      sql`SELECT COUNT(*) as count FROM wallets`,
      sql`SELECT COUNT(*) as count FROM withdrawals`,
      sql`SELECT COUNT(*) as count FROM orders`,
    ])

    return NextResponse.json({
      success: true,
      data: {
        machines: {
          total: parseInt(stats[0][0]?.count || 0)
        },
        nodes: {
          total: parseInt(stats[1][0]?.count || 0)
        },
        users: {
          total: parseInt(stats[2][0]?.count || 0)
        },
        withdrawals: {
          total: parseInt(stats[3][0]?.count || 0)
        },
        orders: {
          total: parseInt(stats[4][0]?.count || 0)
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
