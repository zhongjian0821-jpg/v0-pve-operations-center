import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const LINGHAN_CONFIG = {
  baseUrl: 'https://open.linghan.cloud',
  ak: 'cb4e1cc5599d433896bfeb0c94995780',
  as: '37f005ebee964853ae6dc96f8ca28792'
};

export async function POST() {
  const startTime = Date.now();
  
  try {
    console.log('[Sync All] 🚀 开始同步...');
    
    // 1. 获取设备列表
    console.log('[Sync All] 正在获取设备列表...');
    const devicesResponse = await fetch(`${LINGHAN_CONFIG.baseUrl}/getDeviceList`, {
      method: 'GET',
      headers: {
        'ak': LINGHAN_CONFIG.ak,
        'as': LINGHAN_CONFIG.as,
        'Content-Type': 'application/json'
      }
    });
    
    if (!devicesResponse.ok) {
      const errorText = await devicesResponse.text();
      console.error('[Sync All] ❌ 获取设备列表失败:', devicesResponse.status, errorText);
      return NextResponse.json({
        success: false,
        error: `获取设备列表失败: ${devicesResponse.status}`,
        details: errorText
      }, { status: 500 });
    }
    
    const devicesData = await devicesResponse.json();
    const devices = devicesData.data || devicesData || [];
    
    console.log(`[Sync All] ✅ 获取到 ${devices.length} 个设备`);
    
    if (devices.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有设备需要同步',
        total: 0,
        synced: 0,
        failed: 0
      });
    }
    
    // 2. 逐个同步设备
    const results = [];
    
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      const deviceId = device.devId;
      const deviceName = device.devName || deviceId;
      
      console.log(`[Sync All] [${i+1}/${devices.length}] 同步设备: ${deviceName}`);
      
      try {
        // 获取单个设备收益
        const earningsResponse = await fetch(`${LINGHAN_CONFIG.baseUrl}/bandwidth95/${deviceId}`, {
          method: 'GET',
          headers: {
            'ak': LINGHAN_CONFIG.ak,
            'as': LINGHAN_CONFIG.as,
            'Content-Type': 'application/json'
          }
        });
        
        if (!earningsResponse.ok) {
          console.error(`[Sync All] ❌ 设备 ${deviceId} API调用失败: ${earningsResponse.status}`);
          results.push({ 
            success: false, 
            deviceId, 
            deviceName,
            error: `API调用失败: ${earningsResponse.status}` 
          });
          continue;
        }
        
        const earningsData = await earningsResponse.json();
        const earnings = earningsData.data || earningsData;
        
        if (!earnings || !earnings.incomeDate) {
          console.warn(`[Sync All] ⚠️ 设备 ${deviceId} 没有收益数据`);
          results.push({ 
            success: false, 
            deviceId, 
            deviceName,
            error: '没有收益数据' 
          });
          continue;
        }
        
        // 存储到数据库
        await sql`
          INSERT INTO linghan_device_daily_earnings (
            device_id,
            device_name,
            income_date,
            total_income,
            flow,
            fine,
            fine_reason,
            status,
            synced_at
          ) VALUES (
            ${deviceId},
            ${deviceName},
            ${earnings.incomeDate},
            ${parseFloat(earnings.totalIncome) || 0},
            ${parseFloat(earnings.flow) || 0},
            ${parseFloat(earnings.fine) || 0},
            ${earnings.fineReason || ''},
            ${parseInt(earnings.status) || 0},
            CURRENT_TIMESTAMP
          )
          ON CONFLICT (device_id, income_date) 
          DO UPDATE SET
            device_name = EXCLUDED.device_name,
            total_income = EXCLUDED.total_income,
            flow = EXCLUDED.flow,
            fine = EXCLUDED.fine,
            fine_reason = EXCLUDED.fine_reason,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP
        `;
        
        console.log(`[Sync All] ✅ 设备 ${deviceId} 同步成功`);
        results.push({ 
          success: true, 
          deviceId, 
          deviceName,
          income_date: earnings.incomeDate,
          total_income: earnings.totalIncome
        });
        
      } catch (error) {
        console.error(`[Sync All] ❌ 设备 ${deviceId} 处理失败:`, error);
        results.push({ 
          success: false, 
          deviceId, 
          deviceName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const synced = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const duration = Date.now() - startTime;
    
    console.log(`[Sync All] ✅ 完成！成功: ${synced}, 失败: ${failed}, 耗时: ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: `同步完成！成功 ${synced} 个，失败 ${failed} 个`,
      total: devices.length,
      synced,
      failed,
      duration_ms: duration,
      details: results
    });
    
  } catch (error) {
    console.error('[Sync All] 🛑 主进程失败:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
