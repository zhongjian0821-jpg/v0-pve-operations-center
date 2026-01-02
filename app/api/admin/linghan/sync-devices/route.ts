// app/api/admin/linghan/sync-devices/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const LINGHAN_API_BASE = 'https://api.ashvacoin.org/api/linghan';
const LINGHAN_TOKEN = 'sk-T3U5RHxJ18D16D07A6EcFcB41e9547AeA3F6B5E4Ca4b1218';

async function callLinghanAPI(endpoint: string, method = 'POST', data: any = {}) {
  const response = await fetch(`${LINGHAN_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINGHAN_TOKEN}`
    },
    body: method === 'POST' ? JSON.stringify(data) : undefined
  });
  return response.json();
}

export async function POST() {
  try {
    // 1. 获取所有灵瀚云节点
    const nodes = await sql`
      SELECT id, config 
      FROM bl_blockchain_nodes 
      WHERE node_type = 'linghan'
    `;

    if (nodes.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有灵瀚云设备需要同步',
        data: { synced: 0, failed: 0 }
      });
    }

    // 2. 提取所有device_id
    const deviceIds: string[] = [];
    const nodeMap = new Map<string, number>(); // device_id -> node_id

    for (const node of nodes) {
      try {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;
        const deviceId = config.device_id;
        if (deviceId) {
          deviceIds.push(deviceId);
          nodeMap.set(deviceId, node.id);
        }
      } catch (error) {
        console.error(`解析节点 ${node.id} 配置失败:`, error);
      }
    }

    if (deviceIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: '没有有效的设备ID'
      }, { status: 400 });
    }

    // 3. 调用灵瀚云API获取设备信息
    const result = await callLinghanAPI('/getDevListInfo', 'POST', { devIds: deviceIds });

    if (result.code !== 200 && result.code !== 0) {
      return NextResponse.json({
        success: false,
        error: `灵瀚云API错误: ${result.message}`
      }, { status: 500 });
    }

    const devices = result.data || [];
    let synced = 0;
    let failed = 0;

    // 4. 同步到数据库
    for (const device of devices) {
      try {
        const nodeId = nodeMap.get(device.device_id);
        if (!nodeId) continue;

        // 判断在线状态
        const onlineStatus = device.online === true || device.online === 1 || device.online === '1' 
          ? 'online' 
          : 'offline';

        // 插入或更新设备信息
        await sql`
          INSERT INTO linghan_devices (
            node_id,
            device_id,
            device_name,
            province,
            city,
            isp,
            bandwidth_mbps,
            online_status,
            last_sync_at,
            updated_at
          ) VALUES (
            ${nodeId},
            ${device.device_id},
            ${device.device_name || device.device_id.substring(0, 8)},
            ${device.province || ''},
            ${device.city || ''},
            ${device.isp || ''},
            ${device.bandwidth || 0},
            ${onlineStatus},
            NOW(),
            NOW()
          )
          ON CONFLICT (device_id) 
          DO UPDATE SET
            device_name = EXCLUDED.device_name,
            province = EXCLUDED.province,
            city = EXCLUDED.city,
            isp = EXCLUDED.isp,
            bandwidth_mbps = EXCLUDED.bandwidth_mbps,
            online_status = EXCLUDED.online_status,
            last_sync_at = NOW(),
            updated_at = NOW()
        `;

        synced++;
      } catch (error: any) {
        console.error(`同步设备 ${device.device_id} 失败:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: '设备状态同步完成',
      data: {
        total: deviceIds.length,
        synced,
        failed,
        devices: devices.length
      }
    });

  } catch (error: any) {
    console.error('同步设备失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
