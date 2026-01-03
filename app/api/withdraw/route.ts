import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// 最低提现金额 10 USD
const MIN_WITHDRAW_USD = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, amount, ashvaPrice, burnRate } = body
    
    if (!walletAddress || !amount || !ashvaPrice) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数: walletAddress, amount, ashvaPrice'
      }, { status: 400 })
    }
    
    // 计算USD价值
    const amountUSD = amount * ashvaPrice
    
    // 检查最低提现金额
    if (amountUSD < MIN_WITHDRAW_USD) {
      return NextResponse.json({
        success: false,
        error: `提现金额不足,最低提现金额为 $${MIN_WITHDRAW_USD} USD`
      }, { status: 400 })
    }
    
    // 计算销毁金额
    const burnAmount = amount * (burnRate || 0)
    const actualAmount = amount - burnAmount
    
    // 检查用户余额
    const walletResult = await sql`
      SELECT total_earnings 
      FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `
    
    if (walletResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '钱包不存在'
      }, { status: 404 })
    }
    
    const currentBalance = parseFloat(walletResult.rows[0].total_earnings || 0)
    
    if (currentBalance < amount) {
      return NextResponse.json({
        success: false,
        error: `余额不足。当前余额: ${currentBalance.toFixed(2)} ASHVA, 需要: ${amount} ASHVA`
      }, { status: 400 })
    }
    
    // 创建提现记录
    const withdrawalResult = await sql`
      INSERT INTO withdrawal_records (
        wallet_address,
        amount,
        burn_amount,
        actual_amount,
        burn_rate,
        ashva_price,
        amount_usd,
        status,
        created_at
      ) VALUES (
        ${walletAddress.toLowerCase()},
        ${amount},
        ${burnAmount},
        ${actualAmount},
        ${burnRate || 0},
        ${ashvaPrice},
        ${amountUSD},
        'pending',
        NOW()
      )
      RETURNING *
    `
    
    const withdrawal = withdrawalResult.rows[0]
    
    return NextResponse.json({
      success: true,
      data: {
        withdrawalId: withdrawal.id,
        amount: parseFloat(withdrawal.amount),
        burnAmount: parseFloat(withdrawal.burn_amount),
        actualAmount: parseFloat(withdrawal.actual_amount),
        amountUSD: parseFloat(withdrawal.amount_usd),
        status: withdrawal.status,
        createdAt: withdrawal.created_at,
        message: '提现申请已提交,等待管理员审核'
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
    
  } catch (error: any) {
    console.error('Withdraw API error:', error)
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

// GET - 查询提现历史
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
    
    const withdrawals = await sql`
      SELECT * 
      FROM withdrawal_records
      WHERE LOWER(wallet_address) = LOWER(${address})
      ORDER BY created_at DESC
    `
    
    const formattedWithdrawals = withdrawals.rows.map((w: any) => ({
      id: w.id,
      amount: parseFloat(w.amount),
      burnAmount: parseFloat(w.burn_amount),
      actualAmount: parseFloat(w.actual_amount),
      amountUSD: parseFloat(w.amount_usd || 0),
      status: w.status,
      notes: w.notes,
      transactionHash: w.transaction_hash,
      createdAt: w.created_at,
      processedAt: w.processed_at,
      completedAt: w.completed_at
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedWithdrawals,
      total: formattedWithdrawals.length
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
    
  } catch (error: any) {
    console.error('Withdraw GET API error:', error)
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
