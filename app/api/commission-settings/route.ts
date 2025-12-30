export const dynamic = 'force-dynamic';  // 👈 添加这行！

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

// GET /api/commission-settings?address=0x...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return errorResponse('缺少钱包地址参数', 400);
    }
    
    // 获取会员信息
    const member = await sql`
      SELECT 
        wallet_address,
        member_level,
        commission_rate_level1,
        commission_rate_level2
      FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${address})
    `;
    
    if (member.length === 0) {
      return errorResponse('会员不存在', 404);
    }
    
    const memberData = member[0];
    const level = memberData.member_level;
    
    // 基础保底
    const BASE_LEVEL1 = 3;  // 直推保底
    const BASE_LEVEL2 = 2;  // 间推保底
    const BASE_MARKET_PARTNER = 10; // 市场合伙人保底
    
    let settings: any = {
      address: memberData.wallet_address,
      memberLevel: level,
      level1Rate: parseFloat(memberData.commission_rate_level1 || BASE_LEVEL1),
      level2Rate: parseFloat(memberData.commission_rate_level2 || BASE_LEVEL2),
    };
    
    // 根据等级设置不同的权限和层级
    if (level === 'normal') {
      settings.maxDepth = 2;
      settings.totalCommission = 5; // 3% + 2%
      settings.extraRewardRight = 0;
      settings.selfRate = 0;
    } else if (level === 'market_partner') {
      settings.maxDepth = 20;
      settings.totalCommission = 15;
      settings.extraRewardRight = 10; // 15% - 5%(保底)
      
      // 计算自己保留的额外收益
      const level1Extra = Math.max(0, settings.level1Rate - BASE_LEVEL1);
      const level2Extra = Math.max(0, settings.level2Rate - BASE_LEVEL2);
      settings.selfRate = Math.max(0, settings.extraRewardRight - level1Extra - level2Extra);
      
    } else if (level === 'global_partner') {
      settings.maxDepth = 100;
      settings.totalCommission = 20;
      settings.extraRewardRight = 5; // 20% - 15%(保底)
      
      // 查询是否有市场合伙人佣金设置
      const mpConfig = await sql`
        SELECT market_partner_rate 
        FROM commission_config 
        WHERE LOWER(wallet_address) = LOWER(${address})
      `;
      
      const marketPartnerRate = mpConfig.length > 0 
        ? parseFloat(mpConfig[0].market_partner_rate || BASE_MARKET_PARTNER)
        : BASE_MARKET_PARTNER;
      
      settings.marketPartnerRate = marketPartnerRate;
      
      // 计算自己保留的额外收益
      const mpExtra = Math.max(0, marketPartnerRate - BASE_MARKET_PARTNER);
      const level1Extra = Math.max(0, settings.level1Rate - BASE_LEVEL1);
      const level2Extra = Math.max(0, settings.level2Rate - BASE_LEVEL2);
      settings.selfRate = Math.max(0, settings.extraRewardRight - mpExtra - level1Extra - level2Extra);
    }
    
    // 计算额外分配
    settings.level1Extra = Math.max(0, settings.level1Rate - BASE_LEVEL1);
    settings.level2Extra = Math.max(0, settings.level2Rate - BASE_LEVEL2);
    
    if (level === 'global_partner' && settings.marketPartnerRate) {
      settings.marketPartnerExtra = Math.max(0, settings.marketPartnerRate - BASE_MARKET_PARTNER);
    }
    
    return successResponse(settings);
    
  } catch (error: any) {
    console.error('Commission settings error:', error);
    return errorResponse(error.message, 500);
  }
}
