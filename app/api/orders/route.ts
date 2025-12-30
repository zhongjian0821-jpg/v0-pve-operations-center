export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const orderType = searchParams.get('type');
    const status = searchParams.get('status');
    
    // 查询所有订单
    let orders = await sql`
      SELECT 
        n.*,
        w.member_level,
        w.ashva_balance
      FROM nodes n
      LEFT JOIN wallets w ON LOWER(n.wallet_address) = LOWER(w.wallet_address)
      ORDER BY n.created_at DESC
    `;
    
    // 在内存中过滤
    if (walletAddress) {
      orders = orders.filter(o => o.wallet_address.toLowerCase() === walletAddress.toLowerCase());
    }
    
    if (orderType) {
      const nodeType = orderType === 'hosting' ? 'cloud' : 'image';
      orders = orders.filter(o => o.node_type === nodeType);
    }
    
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    
    // 添加订单类型
    const ordersWithType = orders.map(order => ({
      ...order,
      order_type: order.node_type === 'cloud' ? 'hosting' : 'image',
      order_description: order.node_type === 'cloud' ? '云节点托管' : '镜像节点'
    }));
    
    // 统计
    const stats = {
      total: ordersWithType.length,
      hosting: ordersWithType.filter(o => o.node_type === 'cloud').length,
      image: ordersWithType.filter(o => o.node_type === 'image').length,
      by_status: {
        pending: ordersWithType.filter(o => o.status === 'pending').length,
        active: ordersWithType.filter(o => o.status === 'active').length,
        inactive: ordersWithType.filter(o => o.status === 'inactive').length,
        deploying: ordersWithType.filter(o => o.status === 'deploying').length,
      }
    };
    
    return successResponse({
      orders: ordersWithType,
      stats: stats,
      total: ordersWithType.length
    });
    
  } catch (error: any) {
    console.error('Orders API error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, order_type, purchase_price, tx_hash, config } = body;
    
    if (!wallet_address || !order_type || !purchase_price) {
      return errorResponse('缺少必填字段', 400);
    }
    
    if (!['hosting', 'image'].includes(order_type)) {
      return errorResponse('无效的订单类型', 400);
    }
    
    const node_id = `node_${order_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const node_type = order_type === 'hosting' ? 'cloud' : 'image';
    
    const inserted = await sql`
      INSERT INTO nodes (
        node_id, wallet_address, node_type, node_category, status,
        purchase_price, staking_amount, total_earnings,
        cpu_cores, memory_gb, storage_gb, is_transferable,
        visible_to_owner, is_pool_node, deploy_progress,
        health_status, uptime_seconds, error_count,
        cpu_usage_percentage, memory_usage_percentage,
        storage_used_percentage, uptime_percentage,
        data_transferred_gb, staking_status, staking_required_usd,
        tx_hash, created_at, updated_at
      ) VALUES (
        ${node_id}, ${wallet_address}, ${node_type}, ${node_type}, 'pending',
        ${purchase_price}, 0, 0,
        8, 16, 500, ${order_type === 'hosting'},
        true, false, 0, 'pending', 0, 0, 0, 0, 0, 0, 0,
        'not_required', 0, ${tx_hash}, NOW(), NOW()
      )
      RETURNING *
    `;
    
    return successResponse({
      message: '订单创建成功',
      order: {
        ...inserted[0],
        order_type,
        order_description: order_type === 'hosting' ? '云节点托管' : '镜像节点'
      }
    }, 201);
    
  } catch (error: any) {
    console.error('Create order error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { node_id, status, deploy_progress } = body;
    
    if (!node_id) {
      return errorResponse('缺少 node_id', 400);
    }
    
    let updated;
    
    if (status === 'active') {
      updated = await sql`
        UPDATE nodes
        SET status = ${status},
            deploy_progress = 100,
            started_at = NOW(),
            health_status = 'healthy',
            updated_at = NOW()
        WHERE node_id = ${node_id}
        RETURNING *
      `;
    } else if (status) {
      updated = await sql`
        UPDATE nodes
        SET status = ${status},
            updated_at = NOW()
        WHERE node_id = ${node_id}
        RETURNING *
      `;
    } else if (deploy_progress !== undefined) {
      updated = await sql`
        UPDATE nodes
        SET deploy_progress = ${deploy_progress},
            updated_at = NOW()
        WHERE node_id = ${node_id}
        RETURNING *
      `;
    } else {
      return errorResponse('必须提供 status 或 deploy_progress', 400);
    }
    
    if (updated.length === 0) {
      return errorResponse('订单不存在', 404);
    }
    
    return successResponse({
      message: '订单更新成功',
      order: updated[0]
    });
    
  } catch (error: any) {
    console.error('Update order error:', error);
    return errorResponse(error.message, 500);
  }
}
