import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

// GET - 查询所有等级配置
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const config = await sql`
        SELECT * FROM member_level_config 
        WHERE id = ${id}
      `;
      if (config.length === 0) return errorResponse('配置不存在', 404);
      return successResponse(config[0]);
    }
    
    const configs = await sql`
      SELECT * FROM member_level_config 
      ORDER BY min_ashva_amount ASC
    `;
    
    return successResponse({ configs });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST - 创建新等级配置
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const {
      level_name,
      min_ashva_amount,
      min_usd_value,
      commission_rate_level1,
      commission_rate_level2,
      benefits = '',
      is_active = true
    } = body;
    
    if (!level_name || min_ashva_amount === undefined || min_usd_value === undefined) {
      return errorResponse('缺少必需字段', 400);
    }
    
    // 检查是否已存在
    const existing = await sql`
      SELECT id FROM member_level_config 
      WHERE level_name = ${level_name}
    `;
    
    if (existing.length > 0) {
      return errorResponse('该等级已存在', 400);
    }
    
    const result = await sql`
      INSERT INTO member_level_config (
        level_name, min_ashva_amount, min_usd_value,
        commission_rate_level1, commission_rate_level2,
        benefits, is_active, created_at, updated_at
      ) VALUES (
        ${level_name}, ${min_ashva_amount}, ${min_usd_value},
        ${commission_rate_level1}, ${commission_rate_level2},
        ${benefits}, ${is_active}, NOW(), NOW()
      ) RETURNING *
    `;
    
    return successResponse(result[0], '创建成功');
  } catch (error: any) {
    console.error('创建等级配置失败:', error);
    return errorResponse(error.message, 500);
  }
}

// PUT - 更新等级配置
export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const {
      id,
      level_name,
      min_ashva_amount,
      min_usd_value,
      commission_rate_level1,
      commission_rate_level2,
      benefits,
      is_active
    } = body;
    
    if (!id) {
      return errorResponse('ID不能为空', 400);
    }
    
    const result = await sql`
      UPDATE member_level_config 
      SET 
        level_name = ${level_name},
        min_ashva_amount = ${min_ashva_amount},
        min_usd_value = ${min_usd_value},
        commission_rate_level1 = ${commission_rate_level1},
        commission_rate_level2 = ${commission_rate_level2},
        benefits = ${benefits},
        is_active = ${is_active},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return errorResponse('配置不存在', 404);
    }
    
    return successResponse(result[0], '更新成功');
  } catch (error: any) {
    console.error('更新等级配置失败:', error);
    return errorResponse(error.message, 500);
  }
}

// DELETE - 删除等级配置
export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return errorResponse('ID不能为空', 400);
    }
    
    const result = await sql`
      DELETE FROM member_level_config 
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return errorResponse('配置不存在', 404);
    }
    
    return successResponse({ id: result[0].id }, '删除成功');
  } catch (error: any) {
    console.error('删除等级配置失败:', error);
    return errorResponse(error.message, 500);
  }
}
