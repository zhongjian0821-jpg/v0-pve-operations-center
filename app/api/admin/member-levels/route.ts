import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

// GET - 查询会员等级配置
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const level_name = searchParams.get('level_name');
    
    if (level_name) {
      const config = await sql`
        SELECT * FROM member_level_config 
        WHERE level_name = ${level_name}
      `;
      if (config.length === 0) return errorResponse('等级配置不存在', 404);
      return successResponse(config[0]);
    }
    
    const configs = await sql`
      SELECT * FROM member_level_config 
      ORDER BY min_ashva_usd ASC
    `;
    
    return successResponse({ configs });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST - 创建等级配置
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const {
      level_name,
      display_name,
      min_ashva_usd,
      commission_rate_l1 = 0,
      commission_rate_l2 = 0,
      max_team_levels = 2,
      benefits = {}
    } = body;
    
    if (!level_name || !display_name || min_ashva_usd === undefined) {
      return errorResponse('缺少必填字段', 400);
    }
    
    const existing = await sql`
      SELECT id FROM member_level_config 
      WHERE level_name = ${level_name}
    `;
    
    if (existing.length > 0) {
      return errorResponse('该等级已存在', 400);
    }
    
    const result = await sql`
      INSERT INTO member_level_config (
        level_name, display_name, min_ashva_usd,
        commission_rate_l1, commission_rate_l2,
        max_team_levels, benefits,
        created_at, updated_at
      ) VALUES (
        ${level_name}, ${display_name}, ${min_ashva_usd},
        ${commission_rate_l1}, ${commission_rate_l2},
        ${max_team_levels}, ${JSON.stringify(benefits)},
        NOW(), NOW()
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
      level_name,
      display_name,
      min_ashva_usd,
      commission_rate_l1,
      commission_rate_l2,
      max_team_levels,
      benefits,
      is_active
    } = body;
    
    if (!level_name) {
      return errorResponse('等级名称不能为空', 400);
    }
    
    const result = await sql`
      UPDATE member_level_config 
      SET 
        display_name = ${display_name},
        min_ashva_usd = ${min_ashva_usd},
        commission_rate_l1 = ${commission_rate_l1},
        commission_rate_l2 = ${commission_rate_l2},
        max_team_levels = ${max_team_levels},
        benefits = ${JSON.stringify(benefits)},
        is_active = ${is_active},
        updated_at = NOW()
      WHERE level_name = ${level_name}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return errorResponse('等级配置不存在', 404);
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
    const level_name = searchParams.get('level_name');
    
    if (!level_name) {
      return errorResponse('等级名称不能为空', 400);
    }
    
    const result = await sql`
      DELETE FROM member_level_config 
      WHERE level_name = ${level_name}
      RETURNING level_name
    `;
    
    if (result.length === 0) {
      return errorResponse('等级配置不存在', 404);
    }
    
    return successResponse({ level_name: result[0].level_name }, '删除成功');
  } catch (error: any) {
    console.error('删除等级配置失败:', error);
    return errorResponse(error.message, 500);
  }
}
