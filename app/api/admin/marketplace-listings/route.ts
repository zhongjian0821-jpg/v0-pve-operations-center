import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

// GET - 获取市场挂单
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const result = await sql`
        SELECT * FROM marketplace_listings
        WHERE id = ${id}
      `;
      
      if (result.length === 0) {
        return errorResponse('Record not found', 404);
      }
      
      return successResponse(result[0]);
    }

    // 获取所有记录
    const records = await sql`
      SELECT * FROM marketplace_listings
      ORDER BY created_at DESC
    `;

    return successResponse(records);

  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST - 创建市场挂单
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    
    // 动态构建插入语句
    const keys = Object.keys(body);
    const values = Object.values(body);
    
    const columns = keys.join(', ');
    const placeholders = keys.map((_, i) => `${values[${i}]}`).join(', ');
    
    const result = await sql`
      INSERT INTO marketplace_listings (${sql.unsafe(columns)})
      VALUES (${sql.unsafe(placeholders)})
      RETURNING *
    `.values([values]);
    
    return successResponse(result[0]);

  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT - 更新市场挂单
export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return errorResponse('ID is required', 400);
    }
    
    // 构建更新语句
    const updates = Object.keys(updateData)
      .map((key, i) => `${key} = ${updateData[key]}`)
      .join(', ');
    
    const result = await sql`
      UPDATE marketplace_listings
      SET ${sql.unsafe(updates)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return errorResponse('Record not found', 404);
    }
    
    return successResponse(result[0]);

  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE - 删除市场挂单
export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return errorResponse('ID is required', 400);
    }
    
    const result = await sql`
      DELETE FROM marketplace_listings
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return errorResponse('Record not found', 404);
    }
    
    return successResponse({
      message: 'Deleted successfully',
      id: result[0].id
    });

  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
