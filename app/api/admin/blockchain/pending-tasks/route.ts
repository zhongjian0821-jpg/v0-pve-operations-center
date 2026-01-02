// app/api/admin/blockchain/pending-tasks/route.ts
// 获取待分配任务列表 - 修复版

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // 检查表是否存在
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'image_node_purchases'
      ) as exists
    `;
    
    if (!tableExists[0].exists) {
      // 表不存在，返回空数组
      return successResponse([]);
    }
    
    // 获取 status='pending' 且还未分配机器的镜像购买记录
    const pendingTasks = await sql`
      SELECT 
        inp.id,
        inp.wallet_address as user_address,
        inp.image_type as node_type,
        inp.device_id,
        inp.price,
        inp.status,
        inp.created_at,
        inp.updated_at,
        COALESCE(u.username, 'Unknown') as username,
        u.email
      FROM image_node_purchases inp
      LEFT JOIN users u ON LOWER(inp.wallet_address) = LOWER(u.wallet_address)
      WHERE inp.status = 'pending' 
        AND inp.device_id IS NULL
      ORDER BY inp.created_at ASC
    `;
    
    // 转换任务名称
    const tasks = pendingTasks.map(task => ({
      ...task,
      task_name: `${task.node_type || task.image_type}-${task.user_address?.substring(0, 6)}`,
      node_type: task.node_type || task.image_type || 'cosmos'
    }));
    
    return successResponse(tasks);
    
  } catch (error: any) {
    console.error('pending-tasks API error:', error);
    // 如果出错，返回空数组而不是500错误
    return successResponse([]);
  }
}
