// app/api/admin/blockchain/import-linghan-devices/route.ts
// 一键导入已有的灵瀚云设备

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

// 26个已绑定的灵瀚云设备ID
const EXISTING_DEVICE_IDS = [
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
    requireAdmin(request);
    
    const imported = [];
    const skipped = [];
    
    for (const deviceId of EXISTING_DEVICE_IDS) {
      // 检查是否已经导入
      const existing = await sql`
        SELECT * FROM bl_blockchain_nodes 
        WHERE node_type = 'linghan' AND config::text LIKE ${`%${deviceId}%`}
      `;
      
      if (existing.length > 0) {
        skipped.push(deviceId);
        continue;
      }
      
      // 创建虚拟机器记录（如果需要）
      let machineId = null;
      
      // 检查是否有未使用的机器
      const availableMachine = await sql`
        SELECT id FROM bl_machines 
        WHERE status = 'pending' 
        ORDER BY id ASC 
        LIMIT 1
      `;
      
      if (availableMachine.length > 0) {
        machineId = availableMachine[0].id;
      } else {
        // 创建虚拟机器记录
        const newMachine = await sql`
          INSERT INTO bl_machines (
            activation_code,
            status,
            created_at,
            updated_at
          ) VALUES (
            ${`linghan-${deviceId.substring(0, 8)}`},
            'active',
            NOW(),
            NOW()
          )
          RETURNING id
        `;
        machineId = newMachine[0].id;
      }
      
      // 创建灵瀚云节点记录
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
          'linghan',
          'running',
          ${JSON.stringify({
            device_id: deviceId,
            imported: true,
            import_date: new Date().toISOString()
          })},
          NOW(),
          NOW()
        )
        RETURNING *
      `;
      
      imported.push({
        deviceId,
        machineId,
        nodeId: nodeResult[0].id
      });
    }
    
    return successResponse({
      message: '灵瀚云设备导入完成',
      total: EXISTING_DEVICE_IDS.length,
      imported: imported.length,
      skipped: skipped.length,
      details: {
        imported,
        skipped
      }
    });
    
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
