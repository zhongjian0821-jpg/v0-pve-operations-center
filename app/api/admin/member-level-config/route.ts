import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const result = await sql`SELECT * FROM member_level_config WHERE id = ${id}`;
      if (result.length === 0) return errorResponse('配置不存在', 404);
      return successResponse(result[0]);
    }
    
    const records = await sql`SELECT * FROM member_level_config ORDER BY level_number ASC`;
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { 
      level_number, 
      level_name, 
      min_ashva_holdings, 
      commission_rate,
      description 
    } = body;
    
    if (!level_number || !level_name || min_ashva_holdings === undefined) {
      return errorResponse('缺少必需字段');
    }
    
    const result = await sql`
      INSERT INTO member_level_config (
        level_number, level_name, min_ashva_holdings, 
        commission_rate, description, created_at, updated_at
      )
      VALUES (
        ${level_number}, ${level_name}, ${min_ashva_holdings},
        ${commission_rate || 0}, ${description || ''}, NOW(), NOW()
      )
      RETURNING *
    `;
    
    return successResponse(result[0], '等级配置创建成功');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { id, level_number, level_name, min_ashva_holdings, commission_rate, description } = body;
    
    if (!id) {
      return errorResponse('缺少id参数');
    }
    
    const result = await sql`
      UPDATE member_level_config 
      SET 
        level_number = ${level_number},
        level_name = ${level_name},
        min_ashva_holdings = ${min_ashva_holdings},
        commission_rate = ${commission_rate},
        description = ${description},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) return errorResponse('配置不存在', 404);
    return successResponse(result[0], '等级配置更新成功');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return errorResponse('缺少id参数');
    }
    
    await sql`DELETE FROM member_level_config WHERE id = ${id}`;
    return successResponse(null, '删除成功');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
