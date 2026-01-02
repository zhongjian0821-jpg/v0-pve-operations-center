// app/api/test-final-count/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // 查询所有灵瀚云节点
    const all = await sql`
      SELECT id, task_name, config 
      FROM bl_blockchain_nodes 
      WHERE node_type = 'linghan'
      ORDER BY id DESC
    `;
    
    const devices = all.map(n => {
      let deviceId = 'unknown';
      try {
        const config = typeof n.config === 'string' ? JSON.parse(n.config) : n.config;
        deviceId = config.device_id || 'unknown';
      } catch (e) {}
      
      return {
        nodeId: n.id,
        taskName: n.task_name,
        deviceId: deviceId.substring(0, 20) + '...',
        isTest: n.task_name.toLowerCase().includes('test') || deviceId.toLowerCase().includes('test')
      };
    });
    
    const testDevices = devices.filter(d => d.isTest);
    const realDevices = devices.filter(d => !d.isTest);
    
    return NextResponse.json({
      success: true,
      total: devices.length,
      test: testDevices.length,
      real: realDevices.length,
      testDevices: testDevices,
      realDevices: realDevices.slice(0, 10)
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
