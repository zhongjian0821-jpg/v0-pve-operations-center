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
        COALESCE(AVG(cpu_cores), 0) as avg_cpu,
        COALESCE(AVG(memory_total), 0) as avg_memory,
        COALESCE(AVG(disk_total), 0) as avg_disk,
        COALESCE(SUM(allocated_owner), 0) as total_owner_slots,
        COALESCE(SUM(allocated_pool), 0) as total_pool_slots
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
          total: overview[0]?.total || 0,
          online: onlineMachines[0]?.count || 0,
          avg_cpu: parseFloat(overview[0]?.avg_cpu || 0),
          avg_memory: parseFloat(overview[0]?.avg_memory || 0),
          avg_disk: parseFloat(overview[0]?.avg_disk || 0),
          total_owner_slots: overview[0]?.total_owner_slots || 0,
          total_pool_slots: overview[0]?.total_pool_slots || 0
        },
        statusDistribution: statusDistribution.map(item => ({
          status: item.status,
          count: parseInt(item.count)
        })),
        recent24h: recentMachines[0]?.count || 0,
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
