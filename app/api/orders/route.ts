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
    
    // 构建查询条件
    let whereConditions = [];
    
    if (walletAddress) {
      whereConditions.push(`LOWER(n.wallet_address) = LOWER('${walletAddress}')`);
    }
    
    if (orderType) {
      const nodeType = orderType === 'hosting' ? 'cloud' : 'image';
      whereConditions.push(`n.node_type = '${nodeType}'`);
    }
    
    if (status) {
      whereConditions.push(`n.status = '${status}'`);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'AND ' + whereConditions.join(' AND ')
      : '';
    
    // 执行查询
    const orders = await sql`
      SELECT 
        n.*,
        w.member_level,
        w.ashva_balance
      FROM nodes n
      LEFT JOIN wallets w ON LOWER(n.wallet_address) = LOWER(w.wallet_address)
      WHERE 1=1 ${sql.raw(whereClause)}
      ORDER BY n.created_at DESC
    `;
    
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
        completed: ordersWithType.filter((o: any) => o.status === 'completed').length
      }
    };
    
    return successResponse({
      records: ordersWithType,
      total: ordersWithType.length,
      stats: stats
    });
    
  } catch (error: any) {
    console.error('[Orders API] Error:', error);
    return errorResponse('获取订单失败: ' + error.message, 500);
  }
}

// POST - 创建新订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, order_type, node_name, node_config } = body;
    
    if (!wallet_address || !order_type) {
      return errorResponse('缺少必要参数: wallet_address, order_type', 400);
    }
    
    const node_type = order_type === 'hosting' ? 'cloud' : 'image';
    
    // 创建订单
    const result = await sql`
      INSERT INTO nodes (
        wallet_address,
        node_type,
        node_name,
        node_config,
        status,
        created_at
      ) VALUES (
        ${wallet_address.toLowerCase()},
        ${node_type},
        ${node_name || 'Node-' + Date.now()},
        ${JSON.stringify(node_config || {})},
        'pending',
        NOW()
      )
      RETURNING *
    `;
    
    return successResponse({
      message: '订单创建成功',
      order: result[0]
    }, 201);
    
  } catch (error: any) {
    console.error('[Orders API] Create error:', error);
    return errorResponse('创建订单失败: ' + error.message, 500);
  }
}

// PUT - 更新订单状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, admin_notes } = body;
    
    if (!id || !status) {
      return errorResponse('缺少必要参数: id, status', 400);
    }
    
    // 验证状态
    const validStatuses = ['pending', 'active', 'inactive', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse('无效的状态值', 400);
    }
    
    // 更新订单
    const result = await sql`
      UPDATE nodes 
      SET 
        status = ${status},
        admin_notes = ${admin_notes || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return errorResponse('订单不存在', 404);
    }
    
    return successResponse({
      message: '订单状态更新成功',
      order: result[0]
    });
    
  } catch (error: any) {
    console.error('[Orders API] Update error:', error);
    return errorResponse('更新订单失败: ' + error.message, 500);
  }
}
