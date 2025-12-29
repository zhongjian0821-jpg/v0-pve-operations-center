import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 会员等级阈值配置
const MEMBER_LEVEL_THRESHOLDS = {
  GLOBAL_PARTNER: 10000, // $10,000 USD
  MARKET_PARTNER: 3000,  // $3,000 USD
};

// 获取ASHVA实时价格
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
    console.error('获取ASHVA价格失败:', error);
  }
  return parseFloat(process.env.NEXT_PUBLIC_ASHVA_PRICE || '0.00008291');
}

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
  const progressPercentage = Math.min(
    Math.round((currentValueUSD / requiredValue) * 100),
    100
  );

  return {
    currentValue: currentValueUSD,
    requiredValue,
    progressPercentage,
    shortfall,
    targetLevel,
    isMaxLevel: false
  };
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

    // 获取ASHVA价格
    const ashvaPrice = await getAshvaPrice();
    console.log('[API] ASHVA价格:', ashvaPrice);

    // 查询钱包基础信息
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

    if (!walletResult || walletResult.length === 0) {
      return NextResponse.json(
        { success: false, error: '钱包地址不存在' },
        { status: 404 }
      );
    }

    const wallet = walletResult[0];

    // 计算ASHVA价值(USD)
    const ashvaBalance = parseFloat(wallet.ashva_balance || '0');
    const ashvaValueUSD = ashvaBalance * ashvaPrice;

    // 计算实际会员等级
    const calculatedLevel = calculateMemberLevel(ashvaValueUSD);

    // 查询等级配置
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

    const levelConfig = levelConfigResult[0] || {
      level_name: calculatedLevel,
      display_name: '普通会员',
      max_depth: 0,
      commission_total_percentage: 0,
      min_ashva_value_usd: 0,
      description: '默认等级'
    };

    // 计算升级进度
    const upgradeProgress = calculateUpgradeProgress(ashvaValueUSD, calculatedLevel);

    // 查询直推人数
    const directReferralsResult = await query(
      `SELECT COUNT(*) as count
      FROM wallets
      WHERE LOWER(parent_wallet) = LOWER($1)`,
      [address]
    );
    const directReferrals = parseInt(directReferralsResult[0]?.count || '0');

    // 查询团队总人数（使用递归CTE）
    const teamSizeResult = await query(
      `WITH RECURSIVE team_tree AS (
        -- 基础：直推成员
        SELECT wallet_address, 1 as level
        FROM wallets
        WHERE LOWER(parent_wallet) = LOWER($1)
        
        UNION ALL
        
        -- 递归：下级成员
        SELECT w.wallet_address, t.level + 1
        FROM wallets w
        INNER JOIN team_tree t ON LOWER(w.parent_wallet) = LOWER(t.wallet_address)
        WHERE t.level < 10
      )
      SELECT COUNT(*) as total_team_size
      FROM team_tree`,
      [address]
    );
    const totalTeamSize = parseInt(teamSizeResult[0]?.total_team_size || '0');

    // 查询节点数量
    const nodesResult = await query(
      `SELECT COUNT(*) as count
      FROM nodes
      WHERE LOWER(wallet_address) = LOWER($1)`,
      [address]
    );
    const nodeCount = parseInt(nodesResult[0]?.count || '0');

    // 计算总收益 (节点收益 + 佣金收益)
    const totalEarnings = parseFloat(wallet.total_earnings || '0');
    const totalCommissions = parseFloat(wallet.distributable_commission || '0') +
                            parseFloat(wallet.distributed_commission || '0');

    // 构建响应数据
    const memberData = {
      // 基础信息
      walletAddress: wallet.wallet_address,
      joinDate: wallet.created_at,
      
      // ASHVA余额和价值
      ashvaBalance: ashvaBalance,
      ashvaPrice: ashvaPrice,
      ashvaValueUSD: ashvaValueUSD,
      
      // 会员等级
      memberLevel: {
        current: calculatedLevel,
        displayName: levelConfig.display_name,
        maxDepth: levelConfig.max_depth,
        commissionRate: parseFloat(levelConfig.commission_total_percentage || '0'),
        minValueUSD: parseFloat(levelConfig.min_ashva_value_usd || '0'),
        description: levelConfig.description
      },
      
      // 升级进度
      upgradeProgress: upgradeProgress,
      
      // 推荐关系
      referral: {
        parentWallet: wallet.parent_wallet,
        directReferrals: directReferrals,
        totalTeamSize: totalTeamSize
      },
      
      // 节点信息
      nodes: {
        count: nodeCount
      },
      
      // 收益信息
      earnings: {
        totalEarnings: totalEarnings,
        nodeEarnings: totalEarnings - totalCommissions,
        commissionEarnings: totalCommissions,
        distributableCommission: parseFloat(wallet.distributable_commission || '0'),
        distributedCommission: parseFloat(wallet.distributed_commission || '0')
      },
      
      // 提现信息
      withdrawal: {
        pendingWithdrawal: parseFloat(wallet.pending_withdrawal || '0'),
        totalWithdrawn: parseFloat(wallet.total_withdrawn || '0'),
        availableBalance: ashvaBalance - parseFloat(wallet.pending_withdrawal || '0')
      },
      
      // 佣金配置
      commissionRates: {
        self: parseFloat(wallet.self_commission_rate || '0'),
        level1: parseFloat(wallet.commission_rate_level1 || '0'),
        level2: parseFloat(wallet.commission_rate_level2 || '0')
      }
    };

    console.log('[API] 会员信息查询成功');

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
