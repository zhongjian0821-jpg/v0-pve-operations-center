// app/api/admin/linghan/cleanup-test-devices/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    // 删除测试设备（config是JSONB类型）
    const result = await sql`
      DELETE FROM bl_blockchain_nodes
      WHERE node_type = 'linghan'
      AND (
        config::text LIKE '%test%'
        OR config::text LIKE '%Test%'
        OR config::text LIKE '%TEST%'
      )
      RETURNING id, task_name, config
    `;
    
    const deleted = result.map(r => {
      let deviceId = 'unknown';
      try {
        const config = typeof r.config === 'string' ? JSON.parse(r.config) : r.config;
        deviceId = config.device_id || 'unknown';
      } catch (e) {}
      
      return {
        nodeId: r.id,
        taskName: r.task_name,
        deviceId: deviceId
      };
    });
    
    return NextResponse.json({
      success: true,
      message: `已删除 ${result.length} 个测试设备`,
      deleted: deleted
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
