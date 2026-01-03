import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const LINGHAN_CONFIG = {
  baseUrl: 'https://open.linghan.cloud',
  ak: 'cb4e1cc5599d433896bfeb0c94995780',
  as: '37f005ebee964853ae6dc96f8ca28792'
};

export async function POST() {
  try {
    console.log('[Sync] 开始同步...');
    
    // 步骤1: 首先确保表存在
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
      console.log('[Sync] ✅ 表检查/创建成功');
    } catch (dbError) {
      console.error('[Sync] 数据库错误:', dbError);
      return NextResponse.json(
        { success: false, error: '数据库错误', details: String(dbError) },
        { status: 500 }
      );
    }
    
    // 步骤2: 获取设备列表
    let devices = [];
    try {
      const response = await fetch(`${LINGHAN_CONFIG.baseUrl}/getDeviceList`, {
        method: 'GET',
        headers: {
          'ak': LINGHAN_CONFIG.ak,
          'as': LINGHAN_CONFIG.as,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API返回 ${response.status}`);
      }
      
      const data = await response.json();
      devices = data.data || data || [];
      console.log(`[Sync] ✅ 获取到 ${devices.length} 个设备`);
    } catch (apiError) {
      console.error('[Sync] API错误:', apiError);
      return NextResponse.json(
        { success: false, error: '灵瀚云API错误', details: String(apiError) },
        { status: 500 }
      );
    }
    
    if (devices.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有设备需要同步',
        total: 0,
        synced: 0,
        failed: 0
      });
    }
    
    // 步骤3: 同步第一个设备（测试）
    const firstDevice = devices[0];
    console.log(`[Sync] 测试同步第一个设备: ${firstDevice.devId}`);
    
    try {
      const response = await fetch(`${LINGHAN_CONFIG.baseUrl}/bandwidth95/${firstDevice.devId}`, {
        method: 'GET',
        headers: {
          'ak': LINGHAN_CONFIG.ak,
          'as': LINGHAN_CONFIG.as,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`设备API返回 ${response.status}`);
      }
      
      const data = await response.json();
      const earningsData = data.data || data;
      
      console.log('[Sync] 收益数据:', JSON.stringify(earningsData).substring(0, 200));
      
      if (earningsData && earningsData.incomeDate) {
        // 写入数据库
        await sql`
          INSERT INTO linghan_device_daily_earnings (
            device_id,
            device_name,
            income_date,
            total_income,
            flow,
            fine,
            fine_reason,
            status
          ) VALUES (
            ${firstDevice.devId},
            ${firstDevice.devName || firstDevice.devId},
            ${earningsData.incomeDate},
            ${earningsData.totalIncome || 0},
            ${earningsData.flow || 0},
            ${earningsData.fine || 0},
            ${earningsData.fineReason || ''},
            ${earningsData.status || 0}
          )
          ON CONFLICT (device_id, income_date) DO NOTHING
        `;
        
        console.log('[Sync] ✅ 数据写入成功');
      }
    } catch (syncError) {
      console.error('[Sync] 同步错误:', syncError);
      return NextResponse.json(
        { success: false, error: '同步错误', details: String(syncError) },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '测试成功！已同步第一个设备',
      total: devices.length,
      synced: 1,
      test_mode: true
    });
    
  } catch (error) {
    console.error('[Sync] 未知错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '未知错误',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
