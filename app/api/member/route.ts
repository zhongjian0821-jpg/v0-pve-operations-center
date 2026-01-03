import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// 会员等级阈值 (USD)
const GLOBAL_PARTNER_THRESHOLD = 10000  // 全球合伙人
const MARKET_PARTNER_THRESHOLD = 3000   // 市场合伙人

// 计算会员等级
function calculateMemberLevel(ashvaValueUSD: number): string {
  if (ashvaValueUSD >= GLOBAL_PARTNER_THRESHOLD) {
    return "global_partner"
  } else if (ashvaValueUSD >= MARKET_PARTNER_THRESHOLD) {
    return "market_partner"
  } else {
    return "normal"
  }
}

// 计算升级进度
function calculateUpgradeProgress(currentValueUSD: number, currentLevel: string) {
  let requiredValue = MARKET_PARTNER_THRESHOLD
  let targetLevel = "market_partner"
  
  if (currentLevel === "market_partner") {
    requiredValue = GLOBAL_PARTNER_THRESHOLD
    targetLevel = "global_partner"
  }
  
  const shortfall = Math.max(0, requiredValue - currentValueUSD)
  const progressPercentage = Math.min(Math.round((currentValueUSD / requiredValue) * 100), 100)
  
  return {
    currentValueUSD,
    requiredValueUSD: requiredValue,
    shortfallUSD: shortfall,
    progressPercentage,
    targetLevel
  }
}

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
    
    // 获取ASHVA价格
    let ashvaPrice = 0.00008291 // 默认价格
    try {
      const priceResponse = await fetch(`${request.nextUrl.origin}/api/ashva-price`, {
        next: { revalidate: 300 }
      })
      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        ashvaPrice = priceData.price
      }
    } catch (error) {
      console.log('使用默认ASHVA价格')
    }
    
    // 获取钱包信息
    const walletResult = await sql`
      SELECT * FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${address})
      LIMIT 1
    `
    
    if (walletResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '钱包地址不存在'
      }, { status: 404 })
    }
    
    const wallet = walletResult.rows[0]
    
    // 获取节点统计
    const nodesResult = await sql`
      SELECT 
        COUNT(*) as total_devices,
        COUNT(*) FILTER (WHERE status = 'active') as active_devices,
        COALESCE(SUM(total_earnings), 0) as node_earnings
      FROM nodes
      WHERE LOWER(wallet_address) = LOWER(${address})
    `
    
    const nodesStats = nodesResult.rows[0]
    
    // 获取团队统计
    const teamResult = await sql`
      SELECT 
        COUNT(DISTINCT wallet_address) FILTER (WHERE level = 1) as direct_members,
        COUNT(DISTINCT wallet_address) as total_team_size
      FROM team_tree
      WHERE LOWER(parent_wallet) = LOWER(${address}) OR LOWER(root_wallet) = LOWER(${address})
    `
    
    const teamStats = teamResult.rows[0] || { direct_members: 0, total_team_size: 0 }
    
    // 获取佣金统计
    const commissionResult = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total_commission,
        COALESCE(SUM(amount) FILTER (WHERE commission_level = 1), 0) as level1_commission,
        COALESCE(SUM(amount) FILTER (WHERE commission_level = 2), 0) as level2_commission
      FROM commission_records
      WHERE LOWER(wallet_address) = LOWER(${address})
    `
    
    const commissionStats = commissionResult.rows[0]
    
    // 计算数据
    const ashvaBalance = parseFloat(wallet.ashva_balance || 0)
    const totalEarnings = parseFloat(wallet.total_earnings || 0)
    const nodeEarnings = parseFloat(nodesStats.node_earnings || 0)
    const commission = parseFloat(commissionStats.total_commission || 0)
    
    const ashvaValueUSD = ashvaBalance * ashvaPrice
    const memberLevel = calculateMemberLevel(ashvaValueUSD)
    const upgradeProgress = calculateUpgradeProgress(ashvaValueUSD, wallet.member_level || 'normal')
    
    // 返回会员详情
    const memberData = {
      address: wallet.wallet_address,
      memberType: wallet.member_level || 'normal',
      memberLevel: wallet.member_level === 'global_partner' ? '全球合伙人' : 
                   wallet.member_level === 'market_partner' ? '市场合伙人' : 
                   '普通会员',
      ashvaBalance: ashvaBalance.toFixed(2),
      ashvaValueUSD: ashvaValueUSD.toFixed(2),
      totalEarnings: totalEarnings.toFixed(2),
      commission: commission.toFixed(2),
      stakingInfo: {
        staked: parseFloat(wallet.staking_amount || 0).toFixed(2),
        rewards: "0.00" // 待实现
      },
      teamStats: {
        directMembers: parseInt(teamStats.direct_members) || 0,
        totalTeamSize: parseInt(teamStats.total_team_size) || 0,
        activeDevices: parseInt(nodesStats.active_devices) || 0
      },
      upgradeProgress,
      devices: {
        total: parseInt(nodesStats.total_devices) || 0,
        active: parseInt(nodesStats.active_devices) || 0,
        earnings: parseFloat(nodeEarnings).toFixed(2)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: memberData
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
    
  } catch (error: any) {
    console.error('Member API error:', error)
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
