import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get('wallet_address')
    const member_level = searchParams.get('member_level')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = `
      SELECT 
        w.id,
        w.wallet_address,
        w.member_level,
        w.parent_wallet,
        w.ashva_balance,
        w.total_earnings,
        w.balance,
        w.staking_amount,
        w.created_at,
        COUNT(DISTINCT n.id) FILTER (WHERE n.status = 'active' OR n.status = 'pending') as devices_count
      FROM wallets w
      LEFT JOIN nodes n ON LOWER(n.wallet_address) = LOWER(w.wallet_address)
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramIndex = 1
    
    // 筛选条件
    if (wallet_address) {
      query += ` AND LOWER(w.wallet_address) = LOWER($${paramIndex})`
      params.push(wallet_address)
      paramIndex++
    }
    
    if (member_level) {
      query += ` AND w.member_level = $${paramIndex}`
      params.push(member_level)
      paramIndex++
    }
    
    if (search) {
      query += ` AND LOWER(w.wallet_address) LIKE LOWER($${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }
    
    query += ` GROUP BY w.id, w.wallet_address, w.member_level, w.parent_wallet, 
               w.ashva_balance, w.total_earnings, w.balance, w.staking_amount, w.created_at`
    query += ` ORDER BY w.created_at DESC`
    query += ` LIMIT $${paramIndex}`
    params.push(limit)
    
    const result = await sql(query, params)
    
    // 转换数据格式 (兼容Web3格式)
    const members = result.rows.map((member: any) => {
      let tier = "bronze"
      const deviceCount = parseInt(member.devices_count) || 0
      const memberLevel = member.member_level || "normal"
      
      // 根据member_level和设备数量判断tier
      if (memberLevel === "global_partner") {
        tier = "platinum"
      } else if (memberLevel === "market_partner") {
        tier = "gold"
      } else if (deviceCount >= 5) {
        tier = "silver"
      } else {
        tier = "bronze"
      }
      
      const shortAddress = member.wallet_address.substring(0, 6) + 
                          "..." + 
                          member.wallet_address.substring(member.wallet_address.length - 4)
      
      return {
        id: member.id,
        walletAddress: member.wallet_address,
        name: shortAddress,
        memberLevel: member.member_level,
        tier,
        devicesCount: deviceCount,
        ashvaBalance: parseFloat(member.ashva_balance || 0),
        totalEarnings: parseFloat(member.total_earnings || 0),
        balance: parseFloat(member.balance || 0),
        stakingAmount: parseFloat(member.staking_amount || 0),
        parentWallet: member.parent_wallet,
        joinedDate: member.created_at
      }
    })
    
    return NextResponse.json({
      success: true,
      data: members,
      total: members.length
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
    
  } catch (error: any) {
    console.error('Members API error:', error)
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
