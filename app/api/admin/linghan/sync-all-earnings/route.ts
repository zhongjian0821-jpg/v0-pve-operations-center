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
    
    console.log('[Init] 数据库表初始化完成');
  } catch (error) {
    console.error('[Init] 初始化失败:', error);
  }
}

// 调用灵瀚云API获取设备列表
async function getLinghanDevices() {
  const response = await fetch(`${LINGHAN_CONFIG.baseUrl}/getDeviceList`, {
    method: 'GET',
    headers: {
      'ak': LINGHAN_CONFIG.ak,
      'as': LINGHAN_CONFIG.as,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`获取设备列表失败: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data || data || [];
}

// 同步单个设备的收益数据
async function syncDeviceEarnings(deviceId: string, deviceName: string) {
  try {
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
      return { success: false, deviceId, error: `API调用失败: ${response.status}` };
    }
    
    const data = await response.json();
    const earningsData = data.data || data;
    
    if (!earningsData || !earningsData.incomeDate) {
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
    
    return { 
      success: true, 
      deviceId, 
      deviceName,
      income_date: earningsData.incomeDate,
      total_income: earningsData.totalIncome 
    };
  } catch (error) {
    return { 
      success: false, 
      deviceId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function POST() {
  const startTime = Date.now();
  console.log('[Sync All] 开始批量同步所有设备收益数据');
  
  try {
    // 1. 初始化数据库（如果表不存在就创建）
    await initDatabase();
    
    // 2. 获取所有设备
    const devices = await getLinghanDevices();
    console.log(`[Sync All] 获取到 ${devices.length} 个设备`);
    
    if (devices.length === 0) {
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
    for (const device of devices) {
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
    
    console.log(`[Sync All] 完成！成功: ${synced}, 失败: ${failed}, 耗时: ${duration}ms`);
    
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
    console.error('[Sync All] 批量同步失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
