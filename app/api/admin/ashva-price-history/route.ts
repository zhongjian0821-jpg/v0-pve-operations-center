import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const priceType = searchParams.get('type') || 'all';
    const days = parseInt(searchParams.get('days') || '30');
    
    // 计算日期
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let records;
    if (priceType === 'all') {
      records = await sql`
        SELECT * FROM ashva_price_history 
        WHERE created_at >= ${startDate.toISOString()}
        ORDER BY created_at DESC 
        LIMIT 1000
      `;
    } else {
      records = await sql`
        SELECT * FROM ashva_price_history 
        WHERE price_type = ${priceType}
          AND created_at >= ${startDate.toISOString()}
        ORDER BY created_at DESC 
        LIMIT 1000
      `;
    }
    
    // 计算统计数据
    const stats = await sql`
      SELECT 
        MAX(price_usd) as max_price,
        MIN(price_usd) as min_price,
        AVG(price_usd) as avg_price,
        COUNT(*) as total_records
      FROM ashva_price_history
      WHERE created_at >= ${startDate.toISOString()}
    `;
    
    return successResponse({
      prices: records,
      stats: stats[0]
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { price_usd, price_type = 'manual', source = 'manual' } = body;
    
    if (!price_usd || price_usd <= 0) {
      return errorResponse('价格必须大于0');
    }
    
    const result = await sql`
      INSERT INTO ashva_price_history (price_usd, price_type, source, created_at)
      VALUES (${price_usd}, ${price_type}, ${source}, NOW())
      RETURNING *
    `;
    
    return successResponse(result[0], '价格记录添加成功');
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
      return errorResponse('缺id参数');
    }
    
    await sql`DELETE FROM ashva_price_history WHERE id = ${id}`;
    
    return successResponse(null, '删除成功');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
