import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // 只统计订单和提现的数量，不涉及金额
    const orderStats = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM orders
    `

    const withdrawalStats = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
      FROM withdrawals
    `

    return NextResponse.json({
      success: true,
      data: {
        orders: {
          total: parseInt(orderStats[0]?.total || 0),
          completed: parseInt(orderStats[0]?.completed || 0),
          pending: parseInt(orderStats[0]?.pending || 0)
        },
        withdrawals: {
          total: parseInt(withdrawalStats[0]?.total || 0),
          pending: parseInt(withdrawalStats[0]?.pending || 0),
          approved: parseInt(withdrawalStats[0]?.approved || 0)
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
