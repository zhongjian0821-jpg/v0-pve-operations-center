import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(message: string, status = 500) {
  console.error(`[Orders API] Error: ${message}`);
  return NextResponse.json({ success: false, error: message }, { status });
}

// GET - 查询订单
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const nodeTypeFilter = searchParams.get('type'); // hosting 或 image
    
    // 查询所有订单
    const orders = await sql`
      SELECT 
        n.*,
        w.member_level,
        w.ashva_balance
      FROM nodes n
      LEFT JOIN wallets w ON LOWER(n.wallet_address) = LOWER(w.wallet_address)
      ORDER BY n.created_at DESC
    `;
    
    // 在应用层过滤
    let filteredOrders = orders;
    
    if (statusFilter) {
      filteredOrders = filteredOrders.filter((o: any) => o.status === statusFilter);
    }
    
    if (nodeTypeFilter) {
      if (nodeTypeFilter === 'hosting') {
        filteredOrders = filteredOrders.filter((o: any) => o.node_type === 'cloud');
      } else if (nodeTypeFilter === 'image') {
        filteredOrders = filteredOrders.filter((o: any) => o.node_type === 'image');
      }
    }
    
    // 添加订单类型描述
    const ordersWithType = filteredOrders.map((order: any) => ({
      ...order,
      order_type: order.node_type === 'cloud' ? 'hosting' : 'image',
      order_description: order.node_type === 'cloud' ? '云节点托管' : '镜像节点'
    }));
    
    // 统计数据
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
    console.error('[Orders API] GET error:', error);
    return errorResponse('获取订单失败: ' + error.message, 500);
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
      cpu_cores,
      memory_gb,
      storage_gb
    } = body;
    
    if (!wallet_address || !order_type || !purchase_price) {
      return errorResponse('缺少必要参数: wallet_address, order_type, purchase_price', 400);
    }
    
    // 转换订单类型
    const node_type = order_type === 'hosting' ? 'cloud' : 'image';
    const node_id = `node_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // 创建订单
    const result = await sql`
      INSERT INTO nodes (
        node_id,
        wallet_address,
        node_type,
        status,
        purchase_price,
        cpu_cores,
        memory_gb,
        storage_gb,
        is_transferable,
        created_at
      ) VALUES (
        ${node_id},
        ${wallet_address.toLowerCase()},
        ${node_type},
        'pending',
        ${purchase_price},
        ${cpu_cores || 0},
        ${memory_gb || 0},
        ${storage_gb || 0},
        ${node_type === 'cloud'},
        NOW()
      )
      RETURNING *
    `;
    
    return successResponse({
      message: '订单创建成功',
      order: result[0],
      order_type: order_type,
      order_description: order_type === 'hosting' ? '云节点托管' : '镜像节点'
    }, 201);
    
  } catch (error: any) {
    console.error('[Orders API] POST error:', error);
    return errorResponse('创建订单失败: ' + error.message, 500);
  }
}

// PUT - 更新订单状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { node_id, status, admin_notes } = body;
    
    if (!node_id || !status) {
      return errorResponse('缺少必要参数: node_id, status', 400);
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
      WHERE node_id = ${node_id}
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
    console.error('[Orders API] PUT error:', error);
    return errorResponse('更新订单失败: ' + error.message, 500);
  }
}
