// app/api/admin/linghan/cleanup-test-devices/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    // 删除测试设备（device_id包含test的）
    const result = await sql`
      DELETE FROM bl_blockchain_nodes
      WHERE node_type = 'linghan'
      AND (
        config->>'device_id' LIKE '%test%'
        OR config->>'device_id' LIKE '%Test%'
        OR config->>'device_id' LIKE '%TEST%'
      )
      RETURNING id, config->>'device_id' as device_id
    `;
    
    return NextResponse.json({
      success: true,
      message: `已删除 ${result.length} 个测试设备`,
      deleted: result.map(r => ({
        nodeId: r.id,
        deviceId: r.device_id
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
