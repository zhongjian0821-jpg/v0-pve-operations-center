// app/api/admin/nodes/stats/route.ts
// 节点统计 API

import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { authenticateAdmin } from '@/lib/auth'
import { apiSuccess, unauthorized, internalError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    // 总节点数
    const totalResult = await sql(`SELECT COUNT(*) as count FROM nodes`)
    const total = Number(totalResult[0]?.count || 0)

    // 按类型统计
    const typeStats = await sql(`
      SELECT 
        node_type,
        COUNT(*) as count
      FROM nodes
      GROUP BY node_type
    `)

    // 按状态统计
    const statusStats = await sql(`
      SELECT 
        status,
        COUNT(*) as count
      FROM nodes
      GROUP BY status
    `)

    // 总收益
    const earningsResult = await sql(`
      SELECT COALESCE(SUM(total_earnings), 0) as total_earnings
      FROM nodes
    `)
    const totalEarnings = Number(earningsResult[0]?.total_earnings || 0)

    // 今日新增节点
    const todayResult = await sql(`
      SELECT COUNT(*) as count
      FROM nodes
      WHERE DATE(created_at) = CURRENT_DATE
    `)
    const todayNew = Number(todayResult[0]?.count || 0)

    // 本月新增节点
    const monthResult = await sql(`
      SELECT COUNT(*) as count
      FROM nodes
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `)
    const monthNew = Number(monthResult[0]?.count || 0)

    // 平均性能指标
    const performanceResult = await sql(`
      SELECT 
        AVG(uptime_percentage) as avg_uptime,
        AVG(cpu_usage_percentage) as avg_cpu_usage,
        AVG(memory_usage_percentage) as avg_memory_usage,
        AVG(storage_used_percentage) as avg_storage_used
      FROM nodes
      WHERE status = 'active'
    `)

    const performance = performanceResult[0] || {}

    return apiSuccess({
      total,
      typeStats,
      statusStats,
      totalEarnings,
      todayNew,
      monthNew,
      performance: {
        avg_uptime: Number(performance.avg_uptime || 0).toFixed(2),
        avg_cpu_usage: Number(performance.avg_cpu_usage || 0).toFixed(2),
        avg_memory_usage: Number(performance.avg_memory_usage || 0).toFixed(2),
        avg_storage_used: Number(performance.avg_storage_used || 0).toFixed(2)
      }
    })
  } catch (error: any) {
    console.error('Get node stats error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to get node statistics')
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
