import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

// GET - 查询钱包
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get('wallet_address');
    
    if (wallet_address) {
      const wallet = await sql`
        SELECT * FROM wallets 
        WHERE wallet_address = ${wallet_address.toLowerCase()}
      `;
      if (wallet.length === 0) return errorResponse('钱包不存在', 404);
      return successResponse(wallet[0]);
    }
    
    const wallets = await sql`
      SELECT * FROM wallets 
      ORDER BY created_at DESC
    `;
    
    return successResponse({ wallets });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST - 创建钱包
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const {
      wallet_address,
      ashva_balance = 0,
      member_level = 'normal',
      commission_rate_level1 = 3.0,
      commission_rate_level2 = 2.0,
      parent_wallet = null
    } = body;
    
    if (!wallet_address) {
      return errorResponse('钱包地址不能为空', 400);
    }
    
    // 检查是否已存在
    const existing = await sql`
      SELECT wallet_address FROM wallets 
      WHERE wallet_address = ${wallet_address.toLowerCase()}
    `;
    
    if (existing.length > 0) {
      return errorResponse('该钱包已存在', 400);
    }
    
    const result = await sql`
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
        WHERE wallet_address = ${parent_wallet.toLowerCase()}
      `;
    }
    
    return successResponse(result[0], '创建成功');
  } catch (error: any) {
    console.error('创建钱包失败:', error);
    return errorResponse(error.message, 500);
  }
}

// PUT - 更新钱包
export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const {
      wallet_address,
      ashva_balance,
      member_level,
      commission_rate_level1,
      commission_rate_level2
    } = body;
    
    if (!wallet_address) {
      return errorResponse('钱包地址不能为空', 400);
    }
    
    const result = await sql`
      UPDATE wallets 
      SET 
        ashva_balance = ${ashva_balance},
        member_level = ${member_level},
        commission_rate_level1 = ${commission_rate_level1},
        commission_rate_level2 = ${commission_rate_level2},
        updated_at = NOW()
      WHERE wallet_address = ${wallet_address.toLowerCase()}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return errorResponse('钱包不存在', 404);
    }
    
    return successResponse(result[0], '更新成功');
  } catch (error: any) {
    console.error('更新钱包失败:', error);
    return errorResponse(error.message, 500);
  }
}

// DELETE - 删除钱包
export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get('wallet_address');
    
    if (!wallet_address) {
      return errorResponse('钱包地址不能为空', 400);
    }
    
    // 删除层级关系
    await sql`
      DELETE FROM hierarchy 
      WHERE wallet_address = ${wallet_address.toLowerCase()}
    `;
    
    // 删除佣金记录
    await sql`
      DELETE FROM commission_records 
      WHERE wallet_address = ${wallet_address.toLowerCase()}
    `;
    
    // 删除钱包
    const result = await sql`
      DELETE FROM wallets 
      WHERE wallet_address = ${wallet_address.toLowerCase()}
      RETURNING wallet_address
    `;
    
    if (result.length === 0) {
      return errorResponse('钱包不存在', 404);
    }
    
    return successResponse({ wallet_address: result[0].wallet_address }, '删除成功');
  } catch (error: any) {
    console.error('删除钱包失败:', error);
    return errorResponse(error.message, 500);
  }
}
