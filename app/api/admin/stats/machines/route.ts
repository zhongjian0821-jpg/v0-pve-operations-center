import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // 机器状态分布
    const statusDistribution = await sql`
      SELECT status, COUNT(*) as count
      FROM machines
      GROUP BY status
    `

    // 总体数据（只使用已知存在的字段）
    const overview = await sql`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(allocated_slots), 0) as total_allocated_slots,
        COALESCE(SUM(pool_slots), 0) as total_pool_slots
      FROM machines
    `

    // 最近24小时上线的机器
    const recentMachines = await sql`
      SELECT COUNT(*) as count
      FROM machines
      WHERE activated_at >= NOW() - INTERVAL '24 hours'
    `

    // 在线机器数
    const onlineMachines = await sql`
      SELECT COUNT(*) as count
      FROM machines
      WHERE status = 'online'
    `

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total: parseInt(overview[0]?.total || 0),
          online: parseInt(onlineMachines[0]?.count || 0),
          total_allocated_slots: parseInt(overview[0]?.total_allocated_slots || 0),
          total_pool_slots: parseInt(overview[0]?.total_pool_slots || 0)
        },
        statusDistribution: statusDistribution.map(item => ({
          status: item.status,
          count: parseInt(item.count)
        })),
        recent24h: parseInt(recentMachines[0]?.count || 0),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Get machine stats error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
