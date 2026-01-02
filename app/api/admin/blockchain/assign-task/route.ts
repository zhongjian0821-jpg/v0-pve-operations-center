// app/api/admin/blockchain/assign-task/route.ts
// 分配任务到机器

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { taskId, machineId } = body;
    
    if (!taskId || !machineId) {
      return errorResponse('taskId and machineId are required', 400);
    }
    
    // 1. 获取待分配任务信息
    const task = await sql`
      SELECT * FROM image_node_purchases WHERE id = ${taskId}
    `;
    
    if (task.length === 0) {
      return errorResponse('Task not found', 404);
    }
    
    const taskInfo = task[0];
    
    // 2. 获取机器信息
    const machine = await sql`
      SELECT * FROM bl_machines WHERE id = ${machineId}
    `;
    
    if (machine.length === 0) {
      return errorResponse('Machine not found', 404);
    }
    
    const machineInfo = machine[0];
    
    // 3. 在 bl_blockchain_nodes 表中创建节点记录
    const nodeResult = await sql`
      INSERT INTO bl_blockchain_nodes (
        machine_id,
        node_type,
        status,
        config,
        created_at,
        updated_at
      ) VALUES (
        ${machineId},
        ${taskInfo.image_type || 'cosmos'},
        'deploying',
        ${JSON.stringify({
          wallet_address: taskInfo.wallet_address,
          purchase_id: taskId,
          price: taskInfo.price
        })},
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    const newNode = nodeResult[0];
    
    // 4. 更新 image_node_purchases 表，标记已分配
    await sql`
      UPDATE image_node_purchases
      SET 
        device_id = ${machineInfo.activation_code || `machine-${machineId}`},
        status = 'assigned',
        activation_date = NOW(),
        updated_at = NOW()
      WHERE id = ${taskId}
    `;
    
    // 5. 更新机器状态（如果需要）
    await sql`
      UPDATE bl_machines
      SET 
        status = 'active',
        updated_at = NOW()
      WHERE id = ${machineId}
    `;
    
    return successResponse({
      message: '任务分配成功',
      node: newNode,
      task: taskInfo,
      machine: machineInfo
    });
    
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
