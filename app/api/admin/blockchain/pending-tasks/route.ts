// app/api/admin/blockchain/pending-tasks/route.ts
// 获取待分配任务列表

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
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
        u.username,
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
    return errorResponse(error.message, 500);
  }
}
