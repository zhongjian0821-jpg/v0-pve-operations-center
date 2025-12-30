export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const results: any = {};
    
    // 1. 列出所有表及其记录数
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    results.all_tables = [];
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      try {
        // 获取记录数
        const countResult = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
        const count = parseInt(countResult[0].count);
        
        // 如果有记录，获取前5条数据
        let sample_data = [];
        if (count > 0) {
          const sampleResult = await sql`SELECT * FROM ${sql(tableName)} LIMIT 5`;
          sample_data = sampleResult;
        }
        
        results.all_tables.push({
          table_name: tableName,
          record_count: count,
          sample_data: sample_data
        });
        
      } catch (e: any) {
        results.all_tables.push({
          table_name: tableName,
          error: e.message
        });
      }
    }
    
    // 2. nodes 表完整数据
    try {
      const allNodes = await sql`SELECT * FROM nodes ORDER BY created_at DESC`;
      results.nodes_full_data = {
        count: allNodes.length,
        data: allNodes
      };
    } catch (e: any) {
      results.nodes_full_data = { error: e.message };
    }
    
    // 3. cloud_node_purchases 完整数据  
    try {
      const allCloud = await sql`SELECT * FROM cloud_node_purchases ORDER BY created_at DESC`;
      results.cloud_purchases_full_data = {
        count: allCloud.length,
        data: allCloud
      };
    } catch (e: any) {
      results.cloud_purchases_full_data = { error: e.message };
    }
    
    // 4. nodes 表结构
    try {
      const schema = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'nodes'
        ORDER BY ordinal_position
      `;
      results.nodes_schema = schema;
    } catch (e: any) {
      results.nodes_schema = { error: e.message };
    }
    
    return successResponse(results);
    
  } catch (error: any) {
    console.error('Query error:', error);
    return errorResponse(error.message, 500);
  }
}
