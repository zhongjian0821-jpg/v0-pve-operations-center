import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { earnings } = body;

    if (!Array.isArray(earnings)) {
      return errorResponse('earnings必须是数组', 400);
    }

    console.log('[批量更新收益] 开始更新', earnings.length, '条记录');

    let updated = 0;
    let failed = 0;

    for (const earning of earnings) {
      try {
        await sql`
          UPDATE assigned_records
          SET 
            total_income = ${earning.total_income},
            daily_income = ${earning.daily_income},
            last_online_at = NOW(),
            updated_at = NOW()
          WHERE node_id = ${earning.node_id}
        `;
        updated++;
      } catch (err) {
        console.error('[批量更新收益] 节点失败:', earning.node_id, err);
        failed++;
      }
    }

    console.log('[批量更新收益] 完成 - 成功:', updated, '失败:', failed);

    return successResponse({ 
      updated_count: updated,
      failed_count: failed,
      total: earnings.length
    }, '批量导入完成');
  } catch (error: any) {
    console.error('[批量更新收益] 失败:', error);
    if (error.message === 'Unauthorized') {
      return errorResponse('未授权', 401);
    }
    return errorResponse(error.message, 500);
  }
}
