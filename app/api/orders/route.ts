export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

// 订单类型定义
type OrderType = 'hosting' | 'image';
type OrderStatus = 'pending' | 'active' | 'inactive' | 'deploying' | 'cancelled';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const orderType = searchParams.get('type') as OrderType | null;
    const status = searchParams.get('status') as OrderStatus | null;
    
    // 构建基础查询
    let query = `
      SELECT 
        n.*,
        w.member_level,
        w.ashva_balance,
        CASE 
          WHEN n.node_type = 'cloud' THEN 'hosting'
          WHEN n.node_type = 'image' THEN 'image'
          ELSE 'hosting'
        END as order_type,
        CASE 
          WHEN n.node_type = 'cloud' THEN '云节点托管'
          WHEN n.node_type = 'image' THEN '镜像节点'
          ELSE '云节点托管'
        END as order_description
      FROM nodes n
      LEFT JOIN wallets w ON LOWER(n.wallet_address) = LOWER(w.wallet_address)
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // 添加筛选条件
    if (walletAddress) {
      query += ` AND LOWER(n.wallet_address) = LOWER($${paramIndex})`;
      params.push(walletAddress);
      paramIndex++;
    }
    
    if (orderType) {
      const nodeType = orderType === 'hosting' ? 'cloud' : 'image';
      query += ` AND n.node_type = $${paramIndex}`;
      params.push(nodeType);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND n.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY n.created_at DESC`;
    
    // 执行查询
    const orders = await sql.query(query, params);
    
    // 统计数据
    const stats = {
      total: orders.rows.length,
      hosting: orders.rows.filter((o: any) => o.node_type === 'cloud').length,
      image: orders.rows.filter((o: any) => o.node_type === 'image').length,
      by_status: {
        pending: orders.rows.filter((o: any) => o.status === 'pending').length,
        active: orders.rows.filter((o: any) => o.status === 'active').length,
        inactive: orders.rows.filter((o: any) => o.status === 'inactive').length,
        deploying: orders.rows.filter((o: any) => o.status === 'deploying').length,
      }
    };
    
    return successResponse({
      orders: orders.rows,
      stats: stats,
      total: orders.rows.length
    });
    
  } catch (error: any) {
    console.error('Orders API error:', error);
    return errorResponse(error.message, 500);
  }
}

// POST - 创建新订单（支付完成后调用）
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
        node_id,
        wallet_address,
        node_type,
        node_category,
        status,
        purchase_price,
        staking_amount,
        total_earnings,
        cpu_cores,
        memory_gb,
        storage_gb,
        is_transferable,
        visible_to_owner,
        is_pool_node,
        deploy_progress,
        health_status,
        uptime_seconds,
        error_count,
        cpu_usage_percentage,
        memory_usage_percentage,
        storage_used_percentage,
        uptime_percentage,
        data_transferred_gb,
        staking_status,
        staking_required_usd,
        tx_hash,
        config,
        created_at,
        updated_at
      ) VALUES (
        ${node_id},
        ${wallet_address},
        ${node_type},
        ${node_type},
        'pending',
        ${purchase_price},
        0,
        0,
        ${config?.cpu_cores || 8},
        ${config?.memory_gb || 16},
        ${config?.storage_gb || 500},
        ${order_type === 'hosting' ? true : false},
        true,
        false,
        0,
        'pending',
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        'not_required',
        0,
        ${tx_hash || null},
        ${config ? JSON.stringify(config) : null},
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    if (inserted.length === 0) {
      return errorResponse('创建订单失败', 500);
    }
    
    const order = inserted[0];
    
    return successResponse({
      message: '订单创建成功',
      order: {
        id: order.id,
        node_id: order.node_id,
        wallet_address: order.wallet_address,
        order_type: order_type,
        order_description: order_type === 'hosting' ? '云节点托管' : '镜像节点',
        status: order.status,
        purchase_price: order.purchase_price,
        created_at: order.created_at
      }
    }, 201);
    
  } catch (error: any) {
    console.error('Create order error:', error);
    return errorResponse(error.message, 500);
  }
}

// PUT - 更新订单状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { node_id, status, deploy_progress } = body;
    
    if (!node_id) {
      return errorResponse('缺少 node_id', 400);
    }
    
    const updates: any = {};
    
    if (status) {
      updates.status = status;
      
      if (status === 'active') {
        updates.started_at = new Date().toISOString();
        updates.deploy_progress = 100;
        updates.health_status = 'healthy';
      }
    }
    
    if (deploy_progress !== undefined) {
      updates.deploy_progress = deploy_progress;
    }
    
    updates.updated_at = new Date().toISOString();
    
    // 构建更新查询
    const setClauses = Object.keys(updates).map((key, index) => {
      return `${key} = $${index + 2}`;
    }).join(', ');
    
    const values = [node_id, ...Object.values(updates)];
    
    const query = `
      UPDATE nodes
      SET ${setClauses}
      WHERE node_id = $1
      RETURNING *
    `;
    
    const updated = await sql.query(query, values);
    
    if (updated.rows.length === 0) {
      return errorResponse('订单不存在', 404);
    }
    
    return successResponse({
      message: '订单更新成功',
      order: updated.rows[0]
    });
    
  } catch (error: any) {
    console.error('Update order error:', error);
    return errorResponse(error.message, 500);
  }
}
