import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wallet_address,
      ashva_balance = 0,
      member_level = 'normal',
      parent_wallet = null,
      commission_rate_level1 = 3.0,
      commission_rate_level2 = 2.0
    } = body;

    // 检查是否已存在
    const existing = await sql`
      SELECT wallet_address FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${wallet_address})
    `;

    if (existing.length > 0) {
      return errorResponse('会员已存在', 400);
    }

    // 创建新会员
    const newWallet = await sql`
      INSERT INTO wallets (
        wallet_address, ashva_balance, member_level,
        commission_rate_level1, commission_rate_level2,
        parent_wallet, team_size, total_earnings,
        created_at, updated_at
      ) VALUES (
        ${wallet_address.toLowerCase()}, ${ashva_balance}, ${member_level},
        ${commission_rate_level1}, ${commission_rate_level2},
        ${parent_wallet?.toLowerCase() || null}, 0, 0,
        NOW(), NOW()
      ) RETURNING *
    `;

    // 如果有推荐人，创建层级关系
    if (parent_wallet) {
      await sql`
        INSERT INTO hierarchy (wallet_address, parent_wallet, level, created_at)
        VALUES (${wallet_address.toLowerCase()}, ${parent_wallet.toLowerCase()}, 1, NOW())
      `;
      
      // 更新推荐人的团队人数
      await sql`
        UPDATE wallets 
        SET team_size = team_size + 1,
            updated_at = NOW()
        WHERE LOWER(wallet_address) = LOWER(${parent_wallet})
      `;
    }

    return successResponse(newWallet[0], '注册成功');
  } catch (error: any) {
    console.error('注册会员失败:', error);
    return errorResponse(error.message, 500);
  }
}
