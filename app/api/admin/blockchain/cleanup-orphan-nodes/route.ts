// app/api/admin/blockchain/cleanup-orphan-nodes/route.ts
// 清理没有machine_id的孤儿节点

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    // 查找所有没有machine_id的灵瀚云节点
    const orphanNodes = await sql`
      SELECT id, config, created_at
      FROM bl_blockchain_nodes
      WHERE node_type = 'linghan' 
        AND machine_id IS NULL
    `;
    
    if (orphanNodes.length === 0) {
      return successResponse({
        message: '没有发现孤儿节点',
        deleted: 0
      });
    }
    
    // 删除这些孤儿节点
    const deleted = await sql`
      DELETE FROM bl_blockchain_nodes
      WHERE node_type = 'linghan' 
        AND machine_id IS NULL
      RETURNING id
    `;
    
    return successResponse({
      message: `成功清理 ${deleted.length} 个孤儿节点`,
      deleted: deleted.length,
      nodes: orphanNodes.map(n => ({
        id: n.id,
        created_at: n.created_at,
        config: n.config
      }))
    });
    
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
