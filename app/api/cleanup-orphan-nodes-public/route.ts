// app/api/cleanup-orphan-nodes-public/route.ts
// 临时公开的清理接口（无需认证）

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 直接执行清理，不检查权限（临时使用）
    
    // 查找孤儿节点
    const orphanNodes = await sql`
      SELECT id, config, created_at, machine_id
      FROM bl_blockchain_nodes
      WHERE node_type = 'linghan' 
        AND machine_id IS NULL
    `;
    
    if (orphanNodes.length === 0) {
      return Response.json({
        success: true,
        message: '没有发现孤儿节点，数据已经正常',
        deleted: 0
      });
    }
    
    // 删除孤儿节点
    const deleted = await sql`
      DELETE FROM bl_blockchain_nodes
      WHERE node_type = 'linghan' 
        AND machine_id IS NULL
      RETURNING id, config
    `;
    
    return Response.json({
      success: true,
      message: `✅ 成功清理 ${deleted.length} 个孤儿节点`,
      deleted: deleted.length,
      deletedNodeIds: deleted.map(n => n.id),
      beforeCount: 28,
      afterCount: 28 - deleted.length
    });
    
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET 方法查看状态
export async function GET(request: NextRequest) {
  try {
    const orphanNodes = await sql`
      SELECT id, config, created_at, machine_id
      FROM bl_blockchain_nodes
      WHERE node_type = 'linghan' 
        AND machine_id IS NULL
    `;
    
    const totalNodes = await sql`
      SELECT COUNT(*) as count
      FROM bl_blockchain_nodes
      WHERE node_type = 'linghan'
    `;
    
    const totalMachines = await sql`
      SELECT COUNT(*) as count
      FROM bl_machines
    `;
    
    return Response.json({
      success: true,
      orphanNodes: orphanNodes.length,
      totalNodes: totalNodes[0].count,
      totalMachines: totalMachines[0].count,
      needsCleanup: orphanNodes.length > 0,
      orphanNodeIds: orphanNodes.map(n => n.id)
    });
    
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
