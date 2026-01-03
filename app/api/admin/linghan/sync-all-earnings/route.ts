import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const LINGHAN_CONFIG = {
  baseUrl: 'https://open.linghan.cloud',
  ak: 'cb4e1cc5599d433896bfeb0c94995780',
  as: '37f005ebee964853ae6dc96f8ca28792'
};

// 初始化数据库表
async function initDatabase() {
  try {
    console.log('[Init] 开始初始化数据库...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_device_daily_earnings (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        device_name VARCHAR(200),
        income_date DATE NOT NULL,
        total_income DECIMAL(10, 2) DEFAULT 0,
        flow DECIMAL(10, 2) DEFAULT 0,
        fine DECIMAL(10, 2) DEFAULT 0,
        fine_reason TEXT,
        status INTEGER DEFAULT 0,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(device_id, income_date)
      )
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_linghan_earnings_device_date ON linghan_device_daily_earnings(device_id, income_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linghan_earnings_date ON linghan_device_daily_earnings(income_date DESC)`;
    
    console.log('[Init] ✅ 数据库表初始化完成');
    return { success: true };
  } catch (error) {
    console.error('[Init] ❌ 初始化失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    };
  }
}

// 调用灵瀚云API获取设备列表
async function getLinghanDevices() {
  console.log('[API] 正在获取灵瀚云设备列表...');
  
  const response = await fetch(`${LINGHAN_CONFIG.baseUrl}/getDeviceList`, {
    method: 'GET',
    headers: {
      'ak': LINGHAN_CONFIG.ak,
      'as': LINGHAN_CONFIG.as,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API] ❌ 获取设备列表失败: ${response.status}`, errorText);
    throw new Error(`获取设备列表失败: ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`[API] ✅ 获取到设备数据:`, JSON.stringify(data).substring(0, 200));
  return data.data || data || [];
}

// 同步单个设备的收益数据
async function syncDeviceEarnings(deviceId: string, deviceName: string) {
  try {
    console.log(`[Sync] 正在同步设备 ${deviceId}...`);
    
    const apiUrl = `${LINGHAN_CONFIG.baseUrl}/bandwidth95/${deviceId}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'ak': LINGHAN_CONFIG.ak,
        'as': LINGHAN_CONFIG.as,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`[Sync] ❌ 设备 ${deviceId} API调用失败: ${response.status}`);
      return { success: false, deviceId, error: `API调用失败: ${response.status}` };
    }
    
    const data = await response.json();
    const earningsData = data.data || data;
    
    console.log(`[Sync] 设备 ${deviceId} 数据:`, JSON.stringify(earningsData).substring(0, 150));
    
    if (!earningsData || !earningsData.incomeDate) {
      console.warn(`[Sync] ⚠️ 设备 ${deviceId} 没有收益数据`);
      return { success: false, deviceId, error: '没有收益数据' };
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
        ${earningsData.incomeDate},
        ${earningsData.totalIncome || 0},
        ${earningsData.flow || 0},
        ${earningsData.fine || 0},
        ${earningsData.fineReason || ''},
        ${earningsData.status || 0},
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
    
    console.log(`[Sync] ✅ 设备 ${deviceId} 同步成功`);
    
    return { 
      success: true, 
      deviceId, 
      deviceName,
      income_date: earningsData.incomeDate,
      total_income: earningsData.totalIncome 
    };
  } catch (error) {
    console.error(`[Sync] ❌ 设备 ${deviceId} 同步失败:`, error);
    return { 
      success: false, 
      deviceId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function POST() {
  const startTime = Date.now();
  console.log('\n' + '='.repeat(80));
  console.log('[Sync All] 🚀 开始批量同步所有设备收益数据');
  console.log('='.repeat(80) + '\n');
  
  try {
    // 1. 初始化数据库（如果表不存在就创建）
    const initResult = await initDatabase();
    if (!initResult.success) {
      console.error('[Main] ❌ 数据库初始化失败');
      return NextResponse.json({
        success: false,
        error: '数据库初始化失败',
        details: initResult.error,
        stack: initResult.stack
      }, { status: 500 });
    }
    
    // 2. 获取所有设备
    const devices = await getLinghanDevices();
    console.log(`[Main] 📊 获取到 ${devices.length} 个设备\n`);
    
    if (devices.length === 0) {
      console.warn('[Main] ⚠️ 没有找到设备');
      return NextResponse.json({
        success: false,
        message: '没有找到设备',
        total: 0,
        synced: 0,
        failed: 0
      });
    }
    
    // 3. 批量同步所有设备
    const results = [];
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      console.log(`[Main] [${ i+1}/${devices.length}] 处理设备: ${device.devName || device.devId}`);
      
      const result = await syncDeviceEarnings(
        device.devId, 
        device.devName || device.devId
      );
      results.push(result);
      
      // 避免请求过快，间隔100ms
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const synced = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const duration = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log(`[Main] ✅ 同步完成！`);
    console.log(`  - 成功: ${synced} 个`);
    console.log(`  - 失败: ${failed} 个`);
    console.log(`  - 耗时: ${duration}ms`);
    console.log('='.repeat(80) + '\n');
    
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
    console.error('\n' + '='.repeat(80));
    console.error('[Main] 🛑 批量同步失败:', error);
    console.error('='.repeat(80) + '\n');
    
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
