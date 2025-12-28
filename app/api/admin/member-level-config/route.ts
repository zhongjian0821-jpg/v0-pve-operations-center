import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

// GET - 获取所有会员等级配置记录
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // 获取单个记录
      const record = await sql`SELECT * FROM member_level_config WHERE id = ${id}`;
      
      if (record.length === 0) {
        return errorResponse('Record not found', 404);
      }
      
      return successResponse(record[0]);
    } else {
      // 获取所有记录
      const records = await sql`SELECT * FROM member_level_config ORDER BY id DESC`;
      return successResponse(records);
    }
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST - 创建新会员等级配置记录
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    
    // 这里需要根据具体表结构来实现
    // 暂时返回成功，后续完善具体字段
    
    return successResponse({ 
      message: '会员等级配置创建功能待实现',
      data: body 
    }, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT - 更新会员等级配置记录
export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return errorResponse('ID is required', 400);
    }
    
    // 暂时返回成功，后续完善具体字段
    
    return successResponse({ 
      message: '会员等级配置更新功能待实现',
      id 
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE - 删除会员等级配置记录
export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return errorResponse('ID is required', 400);
    }
    
    const result = await sql`
      DELETE FROM member_level_config
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
