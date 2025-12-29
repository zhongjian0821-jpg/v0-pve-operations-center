// app/api/transfer/marketplace/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'active';
    const nodeType = searchParams.get('type');

    console.log('[API] 查询转让市场:', { limit, offset, status, nodeType });

    // 构建查询条件
    let whereConditions = ['t.status = $1'];
    const params: any[] = [status];
    let paramIndex = 2;

    if (nodeType) {
      whereConditions.push(`n.node_type = $${paramIndex}`);
      params.push(nodeType);
      paramIndex++;
    }

    params.push(limit, offset);

    // 查询挂单列表
    const listings = await query(`
      SELECT 
        t.transfer_id,
        t.node_id,
        t.seller_wallet,
        t.buyer_wallet,
        t.asking_price,
        t.status,
        t.description,
        t.created_at,
        t.completed_at,
        n.node_type,
        n.cpu_cores,
        n.memory_gb,
        n.storage_gb,
        n.total_earnings,
        n.uptime_percentage,
        n.created_at as node_created_at
      FROM transfers t
      LEFT JOIN nodes n ON t.node_id = n.node_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    // 统计信息
    const statsParams = [status];
    if (nodeType) {
      statsParams.push(nodeType);
    }
    
    const stats = await query(`
      SELECT COUNT(*) as total_count
      FROM transfers t
      LEFT JOIN nodes n ON t.node_id = n.node_id
      WHERE ${whereConditions.join(' AND ')}
    `, statsParams);

    const formattedListings = listings.map((listing: any) => ({
      id: listing.transfer_id,
      nodeId: listing.node_id,
      sellerWallet: listing.seller_wallet,
      buyerWallet: listing.buyer_wallet,
      askingPrice: parseFloat(listing.asking_price || '0'),
      askingPriceFormatted: `${parseFloat(listing.asking_price || '0').toFixed(2)} ASHVA`,
      status: listing.status,
      description: listing.description,
      node: {
        type: listing.node_type,
        specs: {
          cpu: listing.cpu_cores,
          memory: listing.memory_gb,
          storage: listing.storage_gb
        },
        performance: {
          totalEarnings: parseFloat(listing.total_earnings || '0'),
          uptime: parseFloat(listing.uptime_percentage || '0')
        },
        age: listing.node_created_at
      },
      createdAt: listing.created_at,
      completedAt: listing.completed_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        listings: formattedListings,
        stats: {
          total: parseInt(stats[0].total_count)
        },
        pagination: {
          limit,
          offset
        }
      }
    });

  } catch (error: any) {
    console.error('[API] 查询转让市场失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
