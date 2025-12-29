// app/api/member/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const GLOBAL_PARTNER_THRESHOLD = 10000; // 全球合伙人：$10,000 USD
const MARKET_PARTNER_THRESHOLD = 3000; // 市场合伙人：$3,000 USD

// 计算会员等级
function calculateMemberLevel(ashvaValueUSD: number): string {
  if (ashvaValueUSD >= GLOBAL_PARTNER_THRESHOLD) {
    return 'global_partner';
  } else if (ashvaValueUSD >= MARKET_PARTNER_THRESHOLD) {
    return 'market_partner';
  } else {
    return 'normal';
  }
}

// 计算升级进度
function calculateUpgradeProgress(currentValueUSD: number, currentLevel: string) {
  let requiredValue = MARKET_PARTNER_THRESHOLD;
  let targetLevel = 'market_partner';

  if (currentLevel === 'market_partner') {
    requiredValue = GLOBAL_PARTNER_THRESHOLD;
    targetLevel = 'global_partner';
  } else if (currentLevel === 'global_partner') {
    return {
      currentValue: currentValueUSD,
      requiredValue: GLOBAL_PARTNER_THRESHOLD,
      progressPercentage: 100,
      shortfall: 0,
      targetLevel: 'global_partner',
      isMaxLevel: true
    };
  }

  const shortfall = Math.max(0, requiredValue - currentValueUSD);
  const progressPercentage = Math.min(Math.round((currentValueUSD / requiredValue) * 100), 100);

  return {
    currentValue: currentValueUSD,
    requiredValue,
    progressPercentage,
    shortfall,
    targetLevel,
    isMaxLevel: false
  };
}

// 获取ASHVA价格
async function getAshvaPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.dexscreener.com/latest/dex/tokens/0xea75cb12bbe6232eb082b365f450d3fe06d02fb3'
    );
    if (response.ok) {
      const data = await response.json();
      if (data.pairs && data.pairs.length > 0) {
        const price = parseFloat(data.pairs[0].priceUsd);
        if (price > 0) return price;
      }
    }
  } catch (error) {
    console.error('[API] 获取ASHVA价格失败:', error);
  }
  return parseFloat(process.env.NEXT_PUBLIC_ASHVA_PRICE || '0.00008291');
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address') || searchParams.get('wallet');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    console.log('[API] 获取会员信息:', address);

    // 获取ASHVA价格
    const ashvaPrice = await getAshvaPrice();
    console.log('[API] ASHVA价格:', ashvaPrice);

    // 查询钱包基础信息
    const walletResult = await query(`
      SELECT 
        wallet_address,
        ashva_balance,
        member_level,
        parent_wallet,
        team_size,
        total_earnings,
        distributable_commission,
        distributed_commission,
        self_commission_rate,
        pending_withdrawal,
        total_withdrawn,
        commission_rate_level1,
        commission_rate_level2,
        created_at,
        updated_at
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER($1)
      LIMIT 1
    `, [address]);

    if (walletResult.length === 0) {
      return NextResponse.json(
        { success: false, error: '钱包不存在' },
        { 
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    const wallet = walletResult[0];
    const ashvaBalance = parseFloat(wallet.ashva_balance || '0');
    const ashvaValueUSD = ashvaBalance * ashvaPrice;

    // 计算会员等级
    const calculatedLevel = calculateMemberLevel(ashvaValueUSD);
    
    // 如果数据库中的等级与计算出的等级不同，更新数据库
    if (wallet.member_level !== calculatedLevel) {
      await query(`
        UPDATE wallets 
        SET member_level = $1, updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(wallet_address) = LOWER($2)
      `, [calculatedLevel, address]);
      wallet.member_level = calculatedLevel;
    }

    // 获取等级配置
    const levelConfigResult = await query(`
      SELECT 
        level_name,
        display_name,
        max_depth,
        commission_total_percentage,
        min_ashva_value_usd,
        description
      FROM member_level_config
      WHERE level_name = $1
    `, [wallet.member_level]);

    const levelConfig = levelConfigResult[0] || {
      level_name: 'normal',
      display_name: '普通会员',
      max_depth: 0,
      commission_total_percentage: 0,
      min_ashva_value_usd: 0,
      description: '默认等级'
    };

    // 查询直推人数
    const directReferralsResult = await query(`
      SELECT COUNT(*) as count
      FROM wallets
      WHERE LOWER(parent_wallet) = LOWER($1)
    `, [address]);

    const directReferrals = parseInt(directReferralsResult[0].count || '0');

    // 查询团队层级分布（如果有hierarchy表数据）
    const hierarchyResult = await query(`
      SELECT level, COUNT(*) as count
      FROM hierarchy
      WHERE LOWER(parent_wallet) = LOWER($1)
      GROUP BY level
      ORDER BY level
    `, [address]);

    const levelDistribution: { [key: string]: number } = {};
    hierarchyResult.forEach((row: any) => {
      levelDistribution[`level${row.level}`] = parseInt(row.count);
    });

    // 查询节点数量
    const nodesResult = await query(`
      SELECT COUNT(*) as count
      FROM nodes
      WHERE LOWER(wallet_address) = LOWER($1)
    `, [address]);

    const totalNodes = parseInt(nodesResult[0].count || '0');

    // 计算升级进度
    const upgradeProgress = calculateUpgradeProgress(ashvaValueUSD, wallet.member_level);

    // 构建响应
    const response = {
      success: true,
      data: {
        // 基础信息
        walletAddress: wallet.wallet_address,
        joinDate: wallet.created_at,
        lastUpdate: wallet.updated_at,
        
        // 余额信息
        ashvaBalance: ashvaBalance,
        ashvaBalanceFormatted: ashvaBalance.toFixed(2),
        ashvaValueUSD: ashvaValueUSD,
        ashvaValueUSDFormatted: `$${ashvaValueUSD.toFixed(2)}`,
        ashvaPrice: ashvaPrice,
        
        // 会员等级
        memberLevel: wallet.member_level,
        memberLevelDisplay: levelConfig.display_name,
        levelConfig: {
          levelName: levelConfig.level_name,
          displayName: levelConfig.display_name,
          maxDepth: levelConfig.max_depth,
          commissionRate: parseFloat(levelConfig.commission_total_percentage || '0'),
          minValueUSD: parseFloat(levelConfig.min_ashva_value_usd || '0'),
          description: levelConfig.description
        },
        
        // 升级进度
        upgradeProgress: upgradeProgress,
        
        // 收益信息
        earnings: {
          total: parseFloat(wallet.total_earnings || '0'),
          distributableCommission: parseFloat(wallet.distributable_commission || '0'),
          distributedCommission: parseFloat(wallet.distributed_commission || '0'),
          pendingWithdrawal: parseFloat(wallet.pending_withdrawal || '0'),
          totalWithdrawn: parseFloat(wallet.total_withdrawn || '0')
        },
        
        // 佣金比例
        commissionRates: {
          self: parseFloat(wallet.self_commission_rate || '0'),
          level1: parseFloat(wallet.commission_rate_level1 || '0'),
          level2: parseFloat(wallet.commission_rate_level2 || '0')
        },
        
        // 团队信息
        team: {
          size: parseInt(wallet.team_size || '0'),
          directReferrals: directReferrals,
          levelDistribution: levelDistribution,
          parentWallet: wallet.parent_wallet
        },
        
        // 节点信息
        nodes: {
          total: totalNodes
        }
      }
    };

    console.log('[API] 会员信息查询成功');
    
    return NextResponse.json(response, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error: any) {
    console.error('[API] 会员信息查询失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '服务器错误'
      },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
