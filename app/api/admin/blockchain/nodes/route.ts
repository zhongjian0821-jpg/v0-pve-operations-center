import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('开始查询节点数据...');
    
    // 先尝试简单查询
    const simpleQuery = await sql`SELECT COUNT(*) as count FROM bl_blockchain_nodes`;
    console.log('总节点数:', simpleQuery[0]?.count);
    
    // 然后查询详细数据
    const records = await sql`
      SELECT 
        n.id,
        n.machine_id,
        n.node_type,
        n.task_name,
        n.status,
        n.config,
        n.created_at,
        n.updated_at,
        m.activation_code
      FROM bl_blockchain_nodes n 
      LEFT JOIN bl_machines m ON n.machine_id = m.id 
      ORDER BY n.created_at DESC
    `;
    
    console.log('查询到的记录数:', records.length);
    
    return successResponse(records);
  } catch (error: any) {
    console.error('查询失败:', error);
    return errorResponse(error.message, 500);
  }
}
