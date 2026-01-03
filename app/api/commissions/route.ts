import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({
        success: false,
        error: '缺少钱包地址参数'
      }, { status: 400 })
    }
    
    // 获取佣金汇总
    const commissionSummary = await sql`
      SELECT 
        commission_level,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count
      FROM commission_records
      WHERE LOWER(wallet_address) = LOWER(${address})
      GROUP BY commission_level
    `
    
    let level1Total = 0
    let level2Total = 0
    let level1Count = 0
    let level2Count = 0
    
    commissionSummary.rows.forEach((row: any) => {
      if (row.commission_level === 1) {
        level1Total = parseFloat(row.total_amount.toString())
        level1Count = parseInt(row.transaction_count.toString())
      } else if (row.commission_level === 2) {
        level2Total = parseFloat(row.total_amount.toString())
        level2Count = parseInt(row.transaction_count.toString())
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        level1Total,
        level2Total,
        level1Count,
        level2Count,
        totalCommission: level1Total + level2Total,
        totalCount: level1Count + level2Count
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
    
  } catch (error: any) {
    console.error('Commissions API error:', error)
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
