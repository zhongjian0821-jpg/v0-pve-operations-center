import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(message: string, status = 500, details?: any) {
  console.error(`[PVE Orders API] Error: ${message}`, details);
  return NextResponse.json({ success: false, error: message, details }, { status });
}

// GET - 查询订单
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const node_type = searchParams.get('node_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // 构建 WHERE 条件
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    if (node_type) {
      conditions.push(`node_type = $${paramIndex}`);
      params.push(node_type);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 查询订单
    const ordersQuery = `
      SELECT * FROM nodes 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    
    const orders = await sql(ordersQuery, params);
    
    // 统计数据
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE node_type = 'hosting') as hosting,
        COUNT(*) FILTER (WHERE node_type = 'image') as image,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
      FROM nodes
      ${whereClause}
    `;
    
    const statsParams = params.slice(0, paramIndex - 1);
    const stats = await sql(statsQuery, statsParams);
    
    return successResponse({
      records: orders,
      stats: {
        total: parseInt(stats[0].total),
        hosting: parseInt(stats[0].hosting),
        image: parseInt(stats[0].image),
        by_status: {
          pending: parseInt(stats[0].pending),
          active: parseInt(stats[0].active),
          completed: parseInt(stats[0].completed),
          cancelled: parseInt(stats[0].cancelled)
        }
      },
      pagination: {
        limit,
        offset,
        total: parseInt(stats[0].total)
      }
    });
    
  } catch (error: any) {
    console.error('[PVE Orders API] GET error:', error);
    return errorResponse('获取订单失败: ' + error.message, 500);
  }
}

// POST - 创建订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      wallet_address, 
      node_type, 
      spec_type, 
      duration_days,
      total_price,
      ashva_amount 
    } = body;
    
    // 验证必填字段
    if (!wallet_address || !node_type || !spec_type || !duration_days || !total_price || !ashva_amount) {
      return errorResponse('缺少必要参数', 400);
    }
    
    // 验证节点类型
    if (!['hosting', 'image'].includes(node_type)) {
      return errorResponse('无效的节点类型', 400);
    }
    
    // 插入订单
    const insertQuery = `
      INSERT INTO nodes (
        wallet_address,
        node_type,
        spec_type,
        duration_days,
        total_price,
        ashva_amount,
        status,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'pending', NOW()
      )
      RETURNING *
    `;
    
    const result = await sql(insertQuery, [
      wallet_address.toLowerCase(),
      node_type,
      spec_type,
      duration_days,
      total_price,
      ashva_amount
    ]);
    
    console.log('[PVE] Order created:', result[0].id);
    
    return successResponse({
      message: '订单创建成功',
      order: result[0]
    }, 201);
    
  } catch (error: any) {
    console.error('[PVE Orders API] POST error:', error);
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
    const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse('无效的状态值', 400);
    }
    
    // 更新订单
    const updateQuery = `
      UPDATE nodes 
      SET status = $1,
          admin_notes = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await sql(updateQuery, [status, admin_notes || null, id]);
    
    if (result.length === 0) {
      return errorResponse('订单不存在', 404);
    }
    
    console.log('[PVE] Order updated:', id, 'status:', status);
    
    return successResponse({
      message: '订单状态更新成功',
      order: result[0]
    });
    
  } catch (error: any) {
    console.error('[PVE Orders API] PUT error:', error);
    return errorResponse('更新订单失败: ' + error.message, 500);
  }
}
