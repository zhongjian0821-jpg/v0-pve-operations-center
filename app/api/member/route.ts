import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 会员等级阈值配置
const MEMBER_LEVEL_THRESHOLDS = {
  GLOBAL_PARTNER: 10000, // $10,000 USD
  MARKET_PARTNER: 3000,  // $3,000 USD
};

// 计算会员等级
function calculateMemberLevel(ashvaValueUSD: number): string {
  if (ashvaValueUSD >= MEMBER_LEVEL_THRESHOLDS.GLOBAL_PARTNER) {
    return 'global_partner';
  } else if (ashvaValueUSD >= MEMBER_LEVEL_THRESHOLDS.MARKET_PARTNER) {
    return 'market_partner';
  } else {
    return 'normal';
  }
}

// 计算升级进度
function calculateUpgradeProgress(currentValueUSD: number, currentLevel: string) {
  let requiredValue = MEMBER_LEVEL_THRESHOLDS.MARKET_PARTNER;
  let targetLevel = 'market_partner';

  if (currentLevel === 'market_partner') {
    requiredValue = MEMBER_LEVEL_THRESHOLDS.GLOBAL_PARTNER;
    targetLevel = 'global_partner';
  } else if (currentLevel === 'global_partner') {
    return {
      currentValue: currentValueUSD,
      requiredValue: MEMBER_LEVEL_THRESHOLDS.GLOBAL_PARTNER,
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
      'https://api.dexscreener.com/latest/dex/tokens/0xea75cb12bbe6232eb082b365f450d3fe06d02fb3',
      { next: { revalidate: 60 } }
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address') || searchParams.get('wallet');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址参数' },
        { status: 400 }
      );
    }

    console.log('[API] 查询会员信息:', address);

    // 1. 查询钱包基础信息
    const walletResult = await query(
      `SELECT 
        wallet_address,
        ashva_balance,
        member_level,
        parent_wallet,
        total_earnings,
        distributable_commission,
        distributed_commission,
        self_commission_rate,
        commission_rate_level1,
        commission_rate_level2,
        pending_withdrawal,
        total_withdrawn,
        team_size,
        created_at,
        updated_at
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER($1)`,
      [address]
    );

    if (walletResult.length === 0) {
      return NextResponse.json(
        { success: false, error: '钱包地址不存在' },
        { status: 404 }
      );
    }

    const wallet = walletResult[0];

    // 2. 获取ASHVA当前价格
    const ashvaPrice = await getAshvaPrice();
    const ashvaValueUSD = parseFloat(wallet.ashva_balance) * ashvaPrice;

    // 3. 计算实际会员等级（基于ASHVA价值）
    const calculatedLevel = calculateMemberLevel(ashvaValueUSD);

    // 4. 获取等级配置信息
    const levelConfigResult = await query(
      `SELECT 
        level_name,
        display_name,
        max_depth,
        commission_total_percentage,
        min_ashva_value_usd,
        description
      FROM member_level_config
      WHERE level_name = $1`,
      [calculatedLevel]
    );

    const levelConfig = levelConfigResult.length > 0 ? levelConfigResult[0] : null;

    // 5. 计算升级进度
    const upgradeProgress = calculateUpgradeProgress(ashvaValueUSD, calculatedLevel);

    // 6. 查询直推人数
    const directReferralsResult = await query(
      `SELECT COUNT(*) as count
      FROM wallets
      WHERE LOWER(parent_wallet) = LOWER($1)`,
      [address]
    );

    const directReferralsCount = parseInt(directReferralsResult[0]?.count || '0');

    // 7. 查询团队总人数（从hierarchy表）
    const teamSizeResult = await query(
      `SELECT COUNT(DISTINCT wallet_address) as count
      FROM hierarchy
      WHERE LOWER(parent_wallet) = LOWER($1)`,
      [address]
    );

    const teamSize = parseInt(teamSizeResult[0]?.count || '0');

    // 8. 构建响应数据
    const memberData = {
      // 基础信息
      walletAddress: wallet.wallet_address,
      joinDate: wallet.created_at,
      
      // 余额信息
      ashvaBalance: parseFloat(wallet.ashva_balance),
      ashvaValueUSD: ashvaValueUSD,
      ashvaPrice: ashvaPrice,
      
      // 等级信息
      memberLevel: calculatedLevel,
      memberLevelDisplay: levelConfig?.display_name || '普通会员',
      levelDescription: levelConfig?.description || '',
      maxCommissionDepth: levelConfig?.max_depth || 0,
      commissionTotalPercentage: parseFloat(levelConfig?.commission_total_percentage || '0'),
      
      // 升级进度
      upgradeProgress: {
        ...upgradeProgress,
        requiredAshva: upgradeProgress.isMaxLevel ? 0 : (upgradeProgress.shortfall / ashvaPrice),
      },
      
      // 收益信息
      totalEarnings: parseFloat(wallet.total_earnings),
      distributableCommission: parseFloat(wallet.distributable_commission),
      distributedCommission: parseFloat(wallet.distributed_commission),
      pendingWithdrawal: parseFloat(wallet.pending_withdrawal),
      totalWithdrawn: parseFloat(wallet.total_withdrawn),
      
      // 佣金比例
      selfCommissionRate: parseFloat(wallet.self_commission_rate),
      commissionRateLevel1: parseFloat(wallet.commission_rate_level1),
      commissionRateLevel2: parseFloat(wallet.commission_rate_level2),
      
      // 团队信息
      parentWallet: wallet.parent_wallet,
      directReferrals: directReferralsCount,
      teamSize: teamSize || wallet.team_size || 0,
      
      // 其他
      updatedAt: wallet.updated_at,
    };

    console.log('[API] 会员信息查询成功:', {
      address: address.substring(0, 10) + '...',
      level: calculatedLevel,
      ashvaValueUSD: ashvaValueUSD.toFixed(2)
    });

    return NextResponse.json({
      success: true,
      data: memberData
    });

  } catch (error: any) {
    console.error('[API] 会员信息查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
