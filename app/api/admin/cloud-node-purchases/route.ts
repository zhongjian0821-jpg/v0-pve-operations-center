import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

// GET - 查询云节点购买记录
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const wallet_address = searchParams.get('wallet_address');
    const status = searchParams.get('status');
    
    // 查询单条记录
    if (id) {
      const record = await sql`
        SELECT * FROM cloud_node_purchases WHERE id = ${id}
      `;
      return successResponse(record[0] || null);
    }
    
    // 按条件查询
    let query = sql`SELECT * FROM cloud_node_purchases WHERE 1=1`;
    
    if (wallet_address) {
      query = sql`${query} AND wallet_address = ${wallet_address}`;
    }
    
    if (status) {
      query = sql`${query} AND status = ${status}`;
    }
    
    query = sql`${query} ORDER BY created_at DESC`;
    
    const records = await query;
    
    return successResponse({
      records,
      total: records.length
    });
    
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST - 创建云节点购买记录
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const {
      wallet_address,
      node_type,
      quantity = 1,
      price_per_node,
      total_price,
      transaction_hash,
      status = 'pending'
    } = body;
    
    // 验证必填字段
    if (!wallet_address || !node_type) {
      return errorResponse('wallet_address and node_type are required', 400);
    }
    
    // 插入记录
    const result = await sql`
      INSERT INTO cloud_node_purchases (
        wallet_address,
        node_type,
        quantity,
        price_per_node,
        total_price,
        transaction_hash,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${wallet_address},
        ${node_type},
        ${quantity},
        ${price_per_node},
        ${total_price},
        ${transaction_hash},
        ${status},
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    return successResponse(result[0], 201);
    
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT - 更新云节点购买记录
export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return errorResponse('id is required', 400);
    }
    
    // 构建更新字段
    const allowedFields = [
      'node_type', 'quantity', 'price_per_node', 'total_price',
      'transaction_hash', 'status'
    ];
    
    const updates: string[] = [];
    const values: any[] = [];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(field);
        values.push(updateData[field]);
      }
    });
    
    if (updates.length === 0) {
      return errorResponse('No fields to update', 400);
    }
    
    // 动态构建SQL
    const setClause = updates.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
    values.push(id);
    
    const result = await sql.query(
      `UPDATE cloud_node_purchases SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return errorResponse('Record not found', 404);
    }
    
    return successResponse(result.rows[0]);
    
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE - 删除云节点购买记录
export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return errorResponse('id is required', 400);
    }
    
    const result = await sql`
      DELETE FROM cloud_node_purchases WHERE id = ${id} RETURNING *
    `;
    
    if (result.length === 0) {
      return errorResponse('Record not found', 404);
    }
    
    return successResponse({ message: 'Record deleted successfully', deleted: result[0] });
    
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
