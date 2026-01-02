// app/api/admin/blockchain/import-now/route.ts
// 临时导入端点 - 无需认证（仅用于一次性导入）

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

const DEVICE_IDS = [
  'bf50d906032f4c9847ab8325f3d2f800',
  'cc738ba7b3f22023469d4d74ce91716b',
  '737c791c894063799e4198af2a1f0bf3',
  '134362593cd952e13cbc1b69f546bb83',
  '5f73c1969848d432c538bd58cc0cc2e3',
  '125bfe907a6c3690986b7fbfea17d4d5',
  '2eb8385a0cd5d778fe1ec34b266b40b3',
  '3afd8908af677ae6964abb0364a53282',
  '9ff908a5ab3c5006f7a30587c5c610f5',
  '2d2733e0eaa36a3e275beecb0c5351e5',
  'cb3c20f05cd89728af14473653401f8d',
  '64ffb4f27fbe27f56feffa35c7df7e6c',
  '5f52e25f7bba7f4473c68de0313b23bc',
  '902f4cdd53f7bb2648f5c889cd619ea0',
  '87210372d2ddcbff8ee16a67f2202fb4',
  '45b1409ac125b2f755153846c33c97e8',
  '0b0e8e9ee416bfa14ee79448df0c65cd',
  '67ee6dbedb3ce054c4afce3a448d2487',
  '8270e97698cadf622c5ff615c9391d84',
  '5aa8e72a0e42e967ec3a1785378fe79d',
  '1f075dad24e5a97b927ceac4462ee665',
  '38ea4444beb10a02e95ecd9ed09746e7',
  '008c4a9a7e36cc4f4a0931afcf42abc6',
  '79b9f541c06c733bdb095850158e4804',
  '150873b1f0aab4b1b9b0d3a72ce40eb3',
  '4074455e1ed475f21ac6e86a0bd9690f'
];

export async function POST(request: NextRequest) {
  try {
    const imported: any[] = [];
    const skipped: any[] = [];
    const failed: any[] = [];
    
    for (const deviceId of DEVICE_IDS) {
      try {
        // 检查是否已存在
        const existing = await sql`
          SELECT id, machine_id 
          FROM bl_blockchain_nodes 
          WHERE node_type = 'linghan' 
          AND config::text LIKE ${`%${deviceId}%`}
        `;
        
        if (existing.length > 0) {
          skipped.push({
            deviceId: deviceId.substring(0, 8) + '...',
            reason: '已存在',
            nodeId: existing[0].id
          });
          continue;
        }
        
        // 创建机器记录
        const machineCode = `LH-${deviceId.substring(0, 8)}`;
        const machineName = `灵瀚云-${deviceId.substring(0, 8)}`;
        
        const machine = await sql`
          INSERT INTO bl_machines (
            activation_code,
            machine_code,
            machine_name,
            status,
            created_at,
            updated_at
          ) VALUES (
            ${machineCode},
            ${machineCode},
            ${machineName},
            'active',
            NOW(),
            NOW()
          )
          RETURNING id
        `;
        
        const machineId = machine[0].id;
        
        // 创建节点记录
        const taskName = `灵瀚云设备-${deviceId.substring(0, 8)}`;
        const config = JSON.stringify({
          device_id: deviceId,
          imported: true,
          import_date: new Date().toISOString(),
          source: 'auto_import'
        });
        
        const node = await sql`
          INSERT INTO bl_blockchain_nodes (
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
            ${taskName},
            'running',
            ${config},
            NOW(),
            NOW()
          )
          RETURNING id
        `;
        
        imported.push({
          deviceId: deviceId.substring(0, 8) + '...',
          machineId: machineId,
          nodeId: node[0].id,
          taskName: taskName
        });
        
      } catch (error: any) {
        failed.push({
          deviceId: deviceId.substring(0, 8) + '...',
          error: error.message
        });
      }
    }
    
    return successResponse({
      message: '导入完成',
      summary: {
        total: DEVICE_IDS.length,
        imported: imported.length,
        skipped: skipped.length,
        failed: failed.length
      },
      details: {
        imported: imported,
        skipped: skipped,
        failed: failed
      }
    });
    
  } catch (error: any) {
    console.error('导入失败:', error);
    return errorResponse(error.message, 500);
  }
}

// 允许GET方法查看状态
export async function GET() {
  try {
    const nodes = await sql`
      SELECT COUNT(*) as count 
      FROM bl_blockchain_nodes 
      WHERE node_type = 'linghan'
    `;
    
    return successResponse({
      message: '当前灵瀚云节点数量',
      count: parseInt(nodes[0].count)
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
