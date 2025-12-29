// app/api/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    console.log('[API] 查询购买记录:', { address, status, limit, offset });

    // 构建查询条件
    let whereConditions = ['LOWER(wallet_address) = LOWER($1)'];
    const params: any[] = [address];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    params.push(limit, offset);

    // 查询购买记录（从nodes表）
    const purchases = await query(`
      SELECT 
        node_id,
        wallet_address,
        node_type,
        status,
        purchase_price,
        staking_amount,
        cpu_cores,
        memory_gb,
        storage_gb,
        tx_hash,
        created_at
      FROM nodes
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    // 统计信息
    const stats = await query(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(purchase_price), 0) as total_spent
      FROM nodes
      WHERE ${whereConditions.join(' AND ')}
    `, params.slice(0, paramIndex - 2));

    const formattedPurchases = purchases.map((purchase: any) => ({
      id: purchase.node_id,
      nodeId: purchase.node_id,
      nodeType: purchase.node_type,
      status: purchase.status,
      price: parseFloat(purchase.purchase_price || '0'),
      priceFormatted: `${parseFloat(purchase.purchase_price || '0').toFixed(2)} ASHVA`,
      stakingAmount: parseFloat(purchase.staking_amount || '0'),
      specs: {
        cpu: purchase.cpu_cores,
        memory: purchase.memory_gb,
        storage: purchase.storage_gb
      },
      txHash: purchase.tx_hash,
      purchaseDate: purchase.created_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        purchases: formattedPurchases,
        stats: {
          total: parseInt(stats[0].total_count),
          totalSpent: parseFloat(stats[0].total_spent),
          totalSpentFormatted: `${parseFloat(stats[0].total_spent).toFixed(2)} ASHVA`
        },
        pagination: {
          limit,
          offset
        }
      }
    });

  } catch (error: any) {
    console.error('[API] 查询购买记录失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
