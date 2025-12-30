export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const orderType = searchParams.get('type');
    const status = searchParams.get('status');
    
    // 构建查询
    let sql = `
      SELECT 
        n.*,
        w.member_level,
        w.ashva_balance
      FROM nodes n
      LEFT JOIN wallets w ON LOWER(n.wallet_address) = LOWER(w.wallet_address)
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (walletAddress) {
      sql += ` AND LOWER(n.wallet_address) = LOWER($${paramIndex})`;
      params.push(walletAddress);
      paramIndex++;
    }
    
    if (orderType) {
      const nodeType = orderType === 'hosting' ? 'cloud' : 'image';
      sql += ` AND n.node_type = $${paramIndex}`;
      params.push(nodeType);
      paramIndex++;
    }
    
    if (status) {
      sql += ` AND n.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ` ORDER BY n.created_at DESC`;
    
    // 执行查询
    const orders = await query(sql, params);
    
    // 添加订单类型
    const ordersWithType = orders.map((order: any) => ({
      ...order,
      order_type: order.node_type === 'cloud' ? 'hosting' : 'image',
      order_description: order.node_type === 'cloud' ? '云节点托管' : '镜像节点'
    }));
    
    // 统计
    const stats = {
      total: ordersWithType.length,
      hosting: ordersWithType.filter((o: any) => o.node_type === 'cloud').length,
      image: ordersWithType.filter((o: any) => o.node_type === 'image').length,
      by_status: {
        pending: ordersWithType.filter((o: any) => o.status === 'pending').length,
        active: ordersWithType.filter((o: any) => o.status === 'active').length,
        inactive: ordersWithType.filter((o: any) => o.status === 'inactive').length,
        deploying: ordersWithType.filter((o: any) => o.status === 'deploying').length,
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
      tx_hash,
      config
    } = body;
    
    if (!wallet_address || !order_type || !purchase_price) {
      return errorResponse('缺少必填字段', 400);
    }
    
    if (!['hosting', 'image'].includes(order_type)) {
      return errorResponse('无效的订单类型', 400);
    }
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const node_id = `node_${order_type}_${timestamp}_${randomStr}`;
    const node_type = order_type === 'hosting' ? 'cloud' : 'image';
    
    const inserted = await query(
      `INSERT INTO nodes (
        node_id, wallet_address, node_type, node_category,
        status, purchase_price, staking_amount, total_earnings,
        cpu_cores, memory_gb, storage_gb, is_transferable,
        visible_to_owner, is_pool_node, deploy_progress,
        health_status, uptime_seconds, error_count,
        cpu_usage_percentage, memory_usage_percentage,
        storage_used_percentage, uptime_percentage,
        data_transferred_gb, staking_status, staking_required_usd,
        tx_hash, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
        $23, $24, $25, $26, NOW(), NOW()
      )
      RETURNING *`,
      [
        node_id, wallet_address, node_type, node_type,
        'pending', purchase_price, 0, 0,
        config?.cpu_cores || 8, config?.memory_gb || 16, config?.storage_gb || 500, order_type === 'hosting',
        true, false, 0,
        'pending', 0, 0,
        0, 0, 0, 0,
        0, 'not_required', 0,
        tx_hash || null
      ]
    );
    
    return successResponse({
      message: '订单创建成功',
      order: {
        ...inserted[0],
        order_type: order_type,
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
    
    let sql = 'UPDATE nodes SET updated_at = NOW()';
    const params: any[] = [node_id];
    let paramIndex = 2;
    
    if (status) {
      sql += `, status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
      
      if (status === 'active') {
        sql += `, started_at = NOW(), deploy_progress = 100, health_status = 'healthy'`;
      }
    }
    
    if (deploy_progress !== undefined) {
      sql += `, deploy_progress = $${paramIndex}`;
      params.push(deploy_progress);
      paramIndex++;
    }
    
    sql += ' WHERE node_id = $1 RETURNING *';
    
    const updated = await query(sql, params);
    
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
