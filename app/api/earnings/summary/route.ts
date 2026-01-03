import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get('wallet')
    
    if (!wallet) {
      return NextResponse.json({
        success: false,
        error: '缺少钱包地址参数'
      }, { status: 400 })
    }
    
    // 获取钱包总收益
    const walletData = await sql`
      SELECT total_earnings
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER(${wallet})
      LIMIT 1
    `
    
    const teamRewards = walletData.rows[0]?.total_earnings 
      ? parseFloat(walletData.rows[0].total_earnings) 
      : 0
    
    // 获取节点收益
    let nodeIncome = 0
    try {
      const nodeData = await sql`
        SELECT COALESCE(SUM(total_earnings), 0) as total_node_income
        FROM nodes
        WHERE LOWER(wallet_address) = LOWER(${wallet})
      `
      nodeIncome = nodeData.rows[0]?.total_node_income 
        ? parseFloat(nodeData.rows[0].total_node_income) 
        : 0
    } catch (error) {
      nodeIncome = 0
    }
    
    // 获取佣金收益
    let commissionIncome = 0
    try {
      const commissionData = await sql`
        SELECT COALESCE(SUM(amount), 0) as total_commission
        FROM commission_records
        WHERE LOWER(wallet_address) = LOWER(${wallet})
      `
      commissionIncome = commissionData.rows[0]?.total_commission 
        ? parseFloat(commissionData.rows[0].total_commission) 
        : 0
    } catch (error) {
      commissionIncome = 0
    }
    
    const totalEarnings = teamRewards + nodeIncome
    
    return NextResponse.json({
      success: true,
      data: {
        teamRewards: parseFloat(teamRewards.toFixed(2)),
        nodeIncome: parseFloat(nodeIncome.toFixed(2)),
        commissionIncome: parseFloat(commissionIncome.toFixed(2)),
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        breakdown: {
          fromNodes: parseFloat((nodeIncome / totalEarnings * 100 || 0).toFixed(2)),
          fromTeam: parseFloat((teamRewards / totalEarnings * 100 || 0).toFixed(2))
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
    console.error('Earnings Summary API error:', error)
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
