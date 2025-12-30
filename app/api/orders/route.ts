export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

type OrderType = 'hosting' | 'image';
type OrderStatus = 'pending' | 'active' | 'inactive' | 'deploying' | 'cancelled';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const orderType = searchParams.get('type') as OrderType | null;
    const status = searchParams.get('status') as OrderStatus | null;
    
    // 使用 sql 模板字符串构建查询
    const baseQuery = sql`
      SELECT 
        n.id,
        n.node_id,
        n.wallet_address,
        n.node_type,
        n.node_category,
        n.status,
        n.purchase_price,
        n.staking_amount,
        n.total_earnings,
        n.cpu_cores,
        n.memory_gb,
        n.storage_gb,
        n.is_transferable,
        n.created_at,
        n.updated_at,
        w.member_level,
        w.ashva_balance
      FROM nodes n
      LEFT JOIN wallets w ON LOWER(n.wallet_address) = LOWER(w.wallet_address)
    `;
    
    // 动态添加条件
    let orders;
    
    if (walletAddress && orderType && status) {
      const nodeType = orderType === 'hosting' ? 'cloud' : 'image';
      orders = await sql`
        ${baseQuery}
        WHERE LOWER(n.wallet_address) = LOWER(${walletAddress})
        AND n.node_type = ${nodeType}
        AND n.status = ${status}
        ORDER BY n.created_at DESC
      `;
    } else if (walletAddress && orderType) {
      const nodeType = orderType === 'hosting' ? 'cloud' : 'image';
      orders = await sql`
        ${baseQuery}
        WHERE LOWER(n.wallet_address) = LOWER(${walletAddress})
        AND n.node_type = ${nodeType}
        ORDER BY n.created_at DESC
      `;
    } else if (walletAddress && status) {
      orders = await sql`
        ${baseQuery}
        WHERE LOWER(n.wallet_address) = LOWER(${walletAddress})
        AND n.status = ${status}
        ORDER BY n.created_at DESC
      `;
    } else if (orderType && status) {
      const nodeType = orderType === 'hosting' ? 'cloud' : 'image';
      orders = await sql`
        ${baseQuery}
        WHERE n.node_type = ${nodeType}
        AND n.status = ${status}
        ORDER BY n.created_at DESC
      `;
    } else if (walletAddress) {
      orders = await sql`
        ${baseQuery}
        WHERE LOWER(n.wallet_address) = LOWER(${walletAddress})
        ORDER BY n.created_at DESC
      `;
    } else if (orderType) {
      const nodeType = orderType === 'hosting' ? 'cloud' : 'image';
      orders = await sql`
        ${baseQuery}
        WHERE n.node_type = ${nodeType}
        ORDER BY n.created_at DESC
      `;
    } else if (status) {
      orders = await sql`
        ${baseQuery}
        WHERE n.status = ${status}
        ORDER BY n.created_at DESC
      `;
    } else {
      orders = await sql`
        ${baseQuery}
        ORDER BY n.created_at DESC
      `;
    }
    
    // 添加订单类型和描述
    const ordersWithType = orders.map(order => ({
      ...order,
      order_type: order.node_type === 'cloud' ? 'hosting' : 'image',
      order_description: order.node_type === 'cloud' ? '云节点托管' : '镜像节点'
    }));
    
    // 统计数据
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
    const {
      wallet_address,
      order_type,
      purchase_price,
      payment_method,
      tx_hash,
      config
    } = body;
    
    if (!wallet_address || !order_type || !purchase_price) {
      return errorResponse('缺少必填字段: wallet_address, order_type, purchase_price', 400);
    }
    
    if (!['hosting', 'image'].includes(order_type)) {
      return errorResponse('无效的订单类型，必须是 hosting 或 image', 400);
    }
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const node_id = `node_${order_type}_${timestamp}_${randomStr}`;
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
        tx_hash, config, created_at, updated_at
      ) VALUES (
        ${node_id}, ${wallet_address}, ${node_type}, ${node_type}, 'pending',
        ${purchase_price}, 0, 0,
        ${config?.cpu_cores || 8}, ${config?.memory_gb || 16}, ${config?.storage_gb || 500},
        ${order_type === 'hosting' ? true : false},
        true, false, 0, 'pending', 0, 0, 0, 0, 0, 0, 0,
        'not_required', 0, ${tx_hash || null},
        ${config ? JSON.stringify(config) : null}, NOW(), NOW()
      )
      RETURNING *
    `;
    
    if (inserted.length === 0) {
      return errorResponse('创建订单失败', 500);
    }
    
    return successResponse({
      message: '订单创建成功',
      order: {
        id: inserted[0].id,
        node_id: inserted[0].node_id,
        wallet_address: inserted[0].wallet_address,
        order_type: order_type,
        order_description: order_type === 'hosting' ? '云节点托管' : '镜像节点',
        status: inserted[0].status,
        purchase_price: inserted[0].purchase_price,
        created_at: inserted[0].created_at
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
    
    if (status && deploy_progress !== undefined) {
      if (status === 'active') {
        updated = await sql`
          UPDATE nodes
          SET status = ${status},
              deploy_progress = ${deploy_progress},
              started_at = NOW(),
              health_status = 'healthy',
              updated_at = NOW()
          WHERE node_id = ${node_id}
          RETURNING *
        `;
      } else {
        updated = await sql`
          UPDATE nodes
          SET status = ${status},
              deploy_progress = ${deploy_progress},
              updated_at = NOW()
          WHERE node_id = ${node_id}
          RETURNING *
        `;
      }
    } else if (status) {
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
      } else {
        updated = await sql`
          UPDATE nodes
          SET status = ${status},
              updated_at = NOW()
          WHERE node_id = ${node_id}
          RETURNING *
        `;
      }
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
