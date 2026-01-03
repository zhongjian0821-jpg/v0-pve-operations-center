import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // 获取总会员数
    const totalUsersResult = await sql`
      SELECT COUNT(*) as total FROM wallets
    `
    
    // 获取会员等级分布
    const levelDistributionResult = await sql`
      SELECT 
        member_level,
        COUNT(*) as count
      FROM wallets
      GROUP BY member_level
    `
    
    // 获取购买统计
    const purchaseStatsResult = await sql`
      SELECT 
        COUNT(*) as total_purchases,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_purchases
      FROM nodes
    `
    
    // 处理等级分布数据
    const levelDistribution: any = {
      normal: 0,
      market_partner: 0,
      global_partner: 0
    }
    
    levelDistributionResult.rows.forEach((row: any) => {
      const level = row.member_level || 'normal'
      levelDistribution[level] = parseInt(row.count)
    })
    
    const purchaseStats = purchaseStatsResult.rows[0]
    
    return NextResponse.json({
      success: true,
      data: {
        totalUsers: parseInt(totalUsersResult.rows[0].total),
        levelDistribution,
        purchaseStats: {
          total_purchases: parseInt(purchaseStats.total_purchases || 0),
          active_purchases: parseInt(purchaseStats.active_purchases || 0)
        }
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
    
  } catch (error: any) {
    console.error('Members Stats API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
