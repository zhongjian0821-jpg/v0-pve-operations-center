export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

// GET /api/orders - 获取所有订单
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    // 从 nodes 表获取订单数据
    const orders = await sql`
      SELECT 
        n.node_id,
        n.wallet_address,
        n.node_type,
        n.status,
        n.purchase_price,
        n.staking_amount,
        n.total_earnings,
        n.created_at,
        n.activated_at,
        w.member_level,
        w.ashva_balance
      FROM nodes n
      LEFT JOIN wallets w ON n.wallet_address = w.wallet_address
      ORDER BY n.created_at DESC
    `;
    
    // 转换为订单格式
    const formattedOrders = orders.map(order => ({
      id: order.node_id,
      wallet_address: order.wallet_address,
      order_type: order.node_type === 'cloud' ? '云节点' : '镜像节点',
      node_type: order.node_type,
      amount: parseFloat(order.purchase_price),
      purchase_price: parseFloat(order.purchase_price),
      staking_amount: parseFloat(order.staking_amount || 0),
      total_earnings: parseFloat(order.total_earnings || 0),
      status: order.status,
      member_level: order.member_level,
      ashva_balance: parseFloat(order.ashva_balance || 0),
      created_at: order.created_at,
      activated_at: order.activated_at
    }));
    
    // 统计数据
    const stats = {
      total: formattedOrders.length,
      cloud_nodes: formattedOrders.filter(o => o.node_type === 'cloud').length,
      image_nodes: formattedOrders.filter(o => o.node_type === 'image').length,
      active: formattedOrders.filter(o => o.status === 'active').length,
      pending: formattedOrders.filter(o => o.status === 'pending').length,
      inactive: formattedOrders.filter(o => o.status === 'inactive').length,
      total_purchase: formattedOrders.reduce((sum, o) => sum + o.purchase_price, 0),
      total_staking: formattedOrders.reduce((sum, o) => sum + o.staking_amount, 0),
      total_earnings: formattedOrders.reduce((sum, o) => sum + o.total_earnings, 0)
    };
    
    return successResponse({
      orders: formattedOrders,
      stats
    });
    
  } catch (error: any) {
    console.error('Orders API error:', error);
    return errorResponse(error.message, 500);
  }
}

// POST /api/orders - 更新订单状态（管理员）
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { node_id, status, activated_at } = body;
    
    if (!node_id || !status) {
      return errorResponse('缺少必要参数', 400);
    }
    
    // 更新订单状态
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'active' && !activated_at) {
      updateData.activated_at = new Date().toISOString();
    }
    
    await sql`
      UPDATE nodes
      SET 
        status = ${status},
        activated_at = ${updateData.activated_at || null}
      WHERE node_id = ${node_id}
    `;
    
    return successResponse({
      message: '订单状态已更新',
      node_id,
      status
    });
    
  } catch (error: any) {
    console.error('Update order error:', error);
    return errorResponse(error.message, 500);
  }
}
