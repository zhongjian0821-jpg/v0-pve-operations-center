import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

// GET - 获取佣金分配记录
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const record = await sql`SELECT * FROM commission_distribution WHERE id = ${id}`;
      
      if (record.length === 0) {
        return errorResponse('Record not found', 404);
      }
      
      return successResponse(record[0]);
    } else {
      const records = await sql`SELECT * FROM commission_distribution ORDER BY id DESC`;
      return successResponse(records);
    }
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST - 创建佣金分配记录
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    
    return successResponse({ 
      message: '佣金分配创建功能待实现',
      data: body 
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT - 更新佣金分配记录
export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return errorResponse('ID is required', 400);
    }
    
    return successResponse({ 
      message: '佣金分配更新功能待实现',
      id 
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE - 删除佣金分配记录
export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return errorResponse('ID is required', 400);
    }
    
    const result = await sql`
      DELETE FROM commission_distribution
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
