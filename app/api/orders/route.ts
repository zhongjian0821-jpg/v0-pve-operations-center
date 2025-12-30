export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

// 订单类型定义
type OrderType = 'hosting' | 'image';  // hosting=托管节点, image=镜像节点
type OrderStatus = 'pending' | 'active' | 'inactive' | 'deploying' | 'cancelled';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const orderType = searchParams.get('type') as OrderType | null; // hosting 或 image
    const status = searchParams.get('status') as OrderStatus | null;
    
    // 构建查询
    let query = sql`
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
        w.ashva_balance,
        
        -- 根据 node_type 判断订单类型
        CASE 
          WHEN n.node_type = 'cloud' THEN 'hosting'
          WHEN n.node_type = 'image' THEN 'image'
          ELSE 'hosting'
        END as order_type,
        
        -- 订单描述
        CASE 
          WHEN n.node_type = 'cloud' THEN '云节点托管'
          WHEN n.node_type = 'image' THEN '镜像节点'
          ELSE '云节点托管'
        END as order_description
        
      FROM nodes n
      LEFT JOIN wallets w ON LOWER(n.wallet_address) = LOWER(w.wallet_address)
      WHERE 1=1
    `;
    
    // 添加筛选条件
    const conditions = [];
    
    if (walletAddress) {
      conditions.push(sql`LOWER(n.wallet_address) = LOWER(${walletAddress})`);
    }
    
    if (orderType) {
      if (orderType === 'hosting') {
        conditions.push(sql`n.node_type = 'cloud'`);
      } else if (orderType === 'image') {
        conditions.push(sql`n.node_type = 'image'`);
      }
    }
    
    if (status) {
      conditions.push(sql`n.status = ${status}`);
    }
    
    // 合并条件
    if (conditions.length > 0) {
      query = sql`${query} AND ${sql.join(conditions, sql` AND `)}`;
    }
    
    query = sql`${query} ORDER BY n.created_at DESC`;
    
    const orders = await query;
    
    // 统计数据
    const stats = {
      total: orders.length,
      hosting: orders.filter(o => o.node_type === 'cloud').length,
      image: orders.filter(o => o.node_type === 'image').length,
      by_status: {
        pending: orders.filter(o => o.status === 'pending').length,
        active: orders.filter(o => o.status === 'active').length,
        inactive: orders.filter(o => o.status === 'inactive').length,
        deploying: orders.filter(o => o.status === 'deploying').length,
      }
    };
    
    return successResponse({
      orders: orders,
      stats: stats,
      total: orders.length
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
      order_type,  // 'hosting' 或 'image'
      purchase_price,
      payment_method,
      tx_hash,
      config  // 配置信息（可选）
    } = body;
    
    // 验证必填字段
    if (!wallet_address || !order_type || !purchase_price) {
      return errorResponse('缺少必填字段: wallet_address, order_type, purchase_price', 400);
    }
    
    // 验证订单类型
    if (!['hosting', 'image'].includes(order_type)) {
      return errorResponse('无效的订单类型，必须是 hosting 或 image', 400);
    }
    
    // 生成节点ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const node_id = `node_${order_type}_${timestamp}_${randomStr}`;
    
    // 确定 node_type
    const node_type = order_type === 'hosting' ? 'cloud' : 'image';
    
    // 插入订单
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
    
    const updates: any = { updated_at: sql`NOW()` };
    
    if (status) {
      updates.status = status;
      
      // 如果状态变为 active，设置激活时间
      if (status === 'active') {
        updates.started_at = sql`NOW()`;
        updates.deploy_progress = 100;
        updates.health_status = 'healthy';
      }
    }
    
    if (deploy_progress !== undefined) {
      updates.deploy_progress = deploy_progress;
    }
    
    const updated = await sql`
      UPDATE nodes
      SET ${sql(updates)}
      WHERE node_id = ${node_id}
      RETURNING *
    `;
    
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
