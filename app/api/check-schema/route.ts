export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // 查询 nodes 表结构
    const schema = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'nodes'
      ORDER BY ordinal_position
    `;
    
    // 尝试插入一个测试订单
    const testNodeId = `test_insert_${Date.now()}`;
    
    let insertResult = null;
    let insertError = null;
    
    try {
      insertResult = await sql`
        INSERT INTO nodes (
          node_id,
          wallet_address,
          node_type,
          status,
          purchase_price
        ) VALUES (
          ${testNodeId},
          '0xtest123',
          'cloud',
          'active',
          1000
        )
        RETURNING *
      `;
    } catch (e: any) {
      insertError = e.message;
    }
    
    return successResponse({
      schema: schema,
      test_insert: {
        success: insertResult !== null,
        error: insertError,
        result: insertResult
      }
    });
    
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
