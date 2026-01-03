import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const level = searchParams.get('level') // "1" 或 "2"
    
    if (!address) {
      return NextResponse.json({
        success: false,
        error: '缺少钱包地址参数'
      }, { status: 400 })
    }
    
    if (!level || (level !== "1" && level !== "2")) {
      return NextResponse.json({
        success: false,
        error: '无效的层级参数,需要 1 或 2'
      }, { status: 400 })
    }
    
    // 获取ASHVA价格
    let ashvaPrice = 0.00008291
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
    
    if (level === "1") {
      // 一级团队: 直推会员
      const level1Members = await sql`
        SELECT 
          wallet_address,
          ashva_balance,
          member_level,
          created_at
        FROM wallets 
        WHERE LOWER(parent_wallet) = LOWER(${address})
        ORDER BY created_at DESC
      `
      
      const membersWithEarnings = level1Members.rows.map((member: any) => {
        const balance = parseFloat(member.ashva_balance || "0")
        const usdValue = balance * ashvaPrice
        // 3% 佣金
        const potentialCommission = usdValue * 0.03
        
        return {
          walletAddress: member.wallet_address,
          ashvaBalance: balance.toFixed(2),
          usdValue: usdValue.toFixed(2),
          memberLevel: member.member_level,
          potentialCommission: potentialCommission.toFixed(2),
          joinedDate: member.created_at
        }
      })
      
      // 计算总计
      const totalCommission = membersWithEarnings.reduce((sum, m) => 
        sum + parseFloat(m.potentialCommission), 0
      )
      
      return NextResponse.json({
        success: true,
        data: {
          level: 1,
          members: membersWithEarnings,
          total: membersWithEarnings.length,
          totalPotentialCommission: totalCommission.toFixed(2)
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
      
    } else {
      // 二级团队: 间接推荐
      // 先找一级成员
      const level1Result = await sql`
        SELECT wallet_address 
        FROM wallets 
        WHERE LOWER(parent_wallet) = LOWER(${address})
      `
      
      if (level1Result.rows.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            level: 2,
            members: [],
            total: 0,
            totalPotentialCommission: "0.00"
          }
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
      
      // 获取所有一级成员的下级
      const level1Addresses = level1Result.rows.map((r: any) => r.wallet_address)
      
      const level2Members = await sql`
        SELECT 
          wallet_address,
          ashva_balance,
          member_level,
          parent_wallet,
          created_at
        FROM wallets 
        WHERE LOWER(parent_wallet) = ANY(${level1Addresses.map((a: string) => a.toLowerCase())})
        ORDER BY created_at DESC
      `
      
      const membersWithEarnings = level2Members.rows.map((member: any) => {
        const balance = parseFloat(member.ashva_balance || "0")
        const usdValue = balance * ashvaPrice
        // 2% 佣金
        const potentialCommission = usdValue * 0.02
        
        return {
          walletAddress: member.wallet_address,
          ashvaBalance: balance.toFixed(2),
          usdValue: usdValue.toFixed(2),
          memberLevel: member.member_level,
          parentWallet: member.parent_wallet,
          potentialCommission: potentialCommission.toFixed(2),
          joinedDate: member.created_at
        }
      })
      
      const totalCommission = membersWithEarnings.reduce((sum, m) => 
        sum + parseFloat(m.potentialCommission), 0
      )
      
      return NextResponse.json({
        success: true,
        data: {
          level: 2,
          members: membersWithEarnings,
          total: membersWithEarnings.length,
          totalPotentialCommission: totalCommission.toFixed(2)
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }
    
  } catch (error: any) {
    console.error('Team API error:', error)
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
