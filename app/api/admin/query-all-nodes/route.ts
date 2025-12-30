export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const results: any = {};
    
    // 1. 查询 nodes 表总记录数
    const countResult = await sql`SELECT COUNT(*) as count FROM nodes`;
    results.total_count = parseInt(countResult[0].count);
    
    // 2. 查询所有 nodes 数据（完整的）
    const allNodes = await sql`
      SELECT 
        node_id,
        wallet_address,
        node_type,
        status,
        purchase_price,
        staking_amount,
        total_earnings,
        created_at
      FROM nodes 
      ORDER BY created_at DESC
    `;
    
    results.all_nodes = allNodes;
    results.query_count = allNodes.length;
    
    // 3. 按状态统计
    const statusStats = await sql`
      SELECT status, COUNT(*) as count 
      FROM nodes 
      GROUP BY status
    `;
    results.status_stats = statusStats;
    
    // 4. 按类型统计
    const typeStats = await sql`
      SELECT node_type, COUNT(*) as count 
      FROM nodes 
      GROUP BY node_type
    `;
    results.type_stats = typeStats;
    
    // 5. 检查表结构
    const schema = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'nodes'
      ORDER BY ordinal_position
    `;
    results.schema = schema;
    
    // 6. 测试：用当前 API 的查询方式
    const apiQuery = await sql`
      SELECT 
        n.node_id,
        n.wallet_address,
        n.node_type,
        n.status,
        n.purchase_price,
        n.staking_amount,
        n.total_earnings,
        n.created_at,
        w.member_level,
        w.ashva_balance
      FROM nodes n
      LEFT JOIN wallets w ON n.wallet_address = w.wallet_address
      ORDER BY n.created_at DESC
    `;
    
    results.api_query_result = {
      count: apiQuery.length,
      data: apiQuery
    };
    
    return successResponse(results);
    
  } catch (error: any) {
    console.error('Query error:', error);
    return errorResponse(error.message, 500);
  }
}
