export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const results: any = {};
    
    // 1. 检查所有表
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    results.tables = tables.map(t => t.tablename);
    
    // 2. 检查 nodes 表的所有数据
    try {
      const nodes = await sql`SELECT * FROM nodes ORDER BY created_at DESC`;
      results.nodes = {
        count: nodes.length,
        data: nodes
      };
    } catch (e: any) {
      results.nodes = { error: e.message };
    }
    
    // 3. 检查 wallets 表
    try {
      const wallets = await sql`SELECT wallet_address, ashva_balance, member_level, created_at FROM wallets LIMIT 10`;
      results.wallets = {
        count: wallets.length,
        data: wallets
      };
    } catch (e: any) {
      results.wallets = { error: e.message };
    }
    
    // 4. 检查 nodes 表结构
    try {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'nodes'
        ORDER BY ordinal_position
      `;
      results.nodes_schema = columns;
    } catch (e: any) {
      results.nodes_schema = { error: e.message };
    }
    
    // 5. 统计各表的记录数
    const tableCounts: any = {};
    for (const table of results.tables) {
      try {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        tableCounts[table] = count[0].count;
      } catch (e: any) {
        tableCounts[table] = `Error: ${e.message}`;
      }
    }
    results.table_counts = tableCounts;
    
    return successResponse(results);
    
  } catch (error: any) {
    console.error('Database check error:', error);
    return errorResponse(error.message, 500);
  }
}
