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

    // 总体数据
    const overview = await sql`
      SELECT 
        COUNT(*) as total,
        AVG(cpu_usage) as avg_cpu,
        AVG(memory_usage) as avg_memory,
        AVG(disk_usage) as avg_disk,
        SUM(allocated_owner) as total_owner_slots,
        SUM(allocated_pool) as total_pool_slots
      FROM machines
    `

    // 最近24小时上线的机器
    const recentMachines = await sql`
      SELECT COUNT(*) as count
      FROM machines
      WHERE activated_at >= NOW() - INTERVAL '24 hours'
    `

    return NextResponse.json({
      success: true,
      data: {
        overview: overview[0],
        statusDistribution,
        recent24h: recentMachines[0],
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
