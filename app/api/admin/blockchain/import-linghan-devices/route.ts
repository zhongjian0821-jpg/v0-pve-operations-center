// app/api/admin/blockchain/import-linghan-devices/route.ts
// 批量导入灵瀚云设备 - 带精确重复检查

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体中的设备ID列表
    const body = await request.json();
    const deviceIds = body.deviceIds || [];
    
    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请提供至少一个设备ID'
      }, { status: 400 });
    }
    
    // 去重输入的设备ID
    const uniqueDeviceIds = [...new Set(deviceIds.map(id => String(id).trim()).filter(id => id.length > 0))];
    
    const imported: any[] = [];
    const skipped: any[] = [];
    const failed: any[] = [];
    
    for (const deviceId of uniqueDeviceIds) {
      try {
        // 验证设备ID格式
        if (typeof deviceId !== 'string' || deviceId.trim().length === 0) {
          failed.push({
            deviceId: String(deviceId).substring(0, 16),
            reason: '无效的设备ID'
          });
          continue;
        }
        
        const cleanDeviceId = deviceId.trim();
        
        // 精确检查是否已经导入（使用JSON提取函数）
        const existing = await sql`
          SELECT id, machine_id, config 
          FROM bl_blockchain_nodes 
          WHERE node_type = 'linghan' 
          AND config->>'device_id' = ${cleanDeviceId}
        `;
        
        if (existing.length > 0) {
          skipped.push({
            deviceId: cleanDeviceId.substring(0, 8) + '...',
            reason: '已存在',
            nodeId: existing[0].id,
            machineId: existing[0].machine_id
          });
          continue;
        }
        
        // 创建灵瀚云节点记录（machine_id 设为 NULL）
        const nodeResult = await sql`
          INSERT INTO bl_blockchain_nodes (
            machine_id,
            node_type,
            task_name,
            status,
            config,
            created_at,
            updated_at
          ) VALUES (
            NULL,
            'linghan',
            ${`灵瀚云-${cleanDeviceId.substring(0, 8)}`},
            'running',
            ${JSON.stringify({
              device_id: cleanDeviceId,
              imported: true,
              import_date: new Date().toISOString(),
              source: 'batch_import'
            })},
            NOW(),
            NOW()
          )
          RETURNING id, task_name
        `;
        
        imported.push({
          deviceId: cleanDeviceId.substring(0, 8) + '...',
          nodeId: nodeResult[0].id,
          taskName: nodeResult[0].task_name
        });
        
      } catch (error: any) {
        console.error(`导入设备 ${deviceId} 失败:`, error);
        failed.push({
          deviceId: String(deviceId).substring(0, 16),
          reason: error.message || '未知错误'
        });
      }
    }
    
    // 构建响应
    const summary = {
      total: deviceIds.length,
      unique: uniqueDeviceIds.length,
      imported: imported.length,
      skipped: skipped.length,
      failed: failed.length
    };
    
    return NextResponse.json({
      success: true,
      message: '灵瀚云设备导入完成',
      data: summary,
      details: {
        imported: imported.slice(0, 10),
        skipped: skipped.slice(0, 10),
        failed: failed.slice(0, 10)
      }
    });
    
  } catch (error: any) {
    console.error('导入灵瀚云设备失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '导入失败'
    }, { status: 500 });
  }
}
