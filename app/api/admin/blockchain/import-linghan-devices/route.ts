// app/api/admin/blockchain/import-linghan-devices/route.ts
// 批量导入灵瀚云设备 - 支持自定义设备ID列表

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    // 获取请求体中的设备ID列表
    const body = await request.json();
    const deviceIds = body.deviceIds || [];
    
    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return errorResponse('请提供至少一个设备ID', 400);
    }
    
    const imported: any[] = [];
    const skipped: any[] = [];
    const failed: any[] = [];
    
    for (const deviceId of deviceIds) {
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
        
        // 检查是否已经导入
        const existing = await sql`
          SELECT id, machine_id, config 
          FROM blockchain_nodes 
          WHERE node_type = 'linghan' 
          AND config::text LIKE ${`%${cleanDeviceId}%`}
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
        
        // 创建虚拟机器记录（如果需要）
        let machineId = null;
        
        // 检查是否有未使用的机器
        const availableMachine = await sql`
          SELECT id, machine_name 
          FROM machines 
          WHERE status = 'pending' 
          ORDER BY id ASC 
          LIMIT 1
        `;
        
        if (availableMachine.length > 0) {
          machineId = availableMachine[0].id;
        } else {
          // 创建虚拟机器记录
          const machineCode = `LH-${cleanDeviceId.substring(0, 8)}`;
          const newMachine = await sql`
            INSERT INTO machines (
              activation_code,
              machine_code,
              machine_name,
              status,
              created_at,
              updated_at
            ) VALUES (
              ${machineCode},
              ${machineCode},
              ${`灵瀚云-${cleanDeviceId.substring(0, 8)}`},
              'active',
              NOW(),
              NOW()
            )
            RETURNING id, machine_name
          `;
          machineId = newMachine[0].id;
        }
        
        // 创建灵瀚云节点记录
        const nodeResult = await sql`
          INSERT INTO blockchain_nodes (
            machine_id,
            node_type,
            task_name,
            status,
            config,
            created_at,
            updated_at
          ) VALUES (
            ${machineId},
            'linghan',
            ${`灵瀚云设备-${cleanDeviceId.substring(0, 8)}`},
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
          machineId: machineId,
          nodeId: nodeResult[0].id,
          taskName: nodeResult[0].task_name
        });
        
      } catch (error: any) {
        failed.push({
          deviceId: String(deviceId).substring(0, 16),
          reason: error.message || '未知错误'
        });
      }
    }
    
    // 构建响应
    const summary = {
      total: deviceIds.length,
      imported: imported.length,
      skipped: skipped.length,
      failed: failed.length
    };
    
    return successResponse({
      message: '灵瀚云设备导入完成',
      data: summary,
      details: {
        imported: imported.slice(0, 10),
        skipped: skipped.slice(0, 10),
        failed: failed.slice(0, 10),
        hasMore: {
          imported: imported.length > 10,
          skipped: skipped.length > 10,
          failed: failed.length > 10
        }
      }
    });
    
  } catch (error: any) {
    console.error('导入灵瀚云设备失败:', error);
    return errorResponse(error.message || '导入失败', 500);
  }
}
