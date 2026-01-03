import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const LINGHAN_CONFIG = {
  baseUrl: 'https://open.linghan.cloud',
  ak: 'cb4e1cc5599d433896bfeb0c94995780',
  as: '37f005ebee964853ae6dc96f8ca28792'
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceId, deviceName } = body;
    
    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
    }
    
    console.log(`[Sync] 开始同步设备 ${deviceId} 的收益数据`);
    
    // 调用灵瀚云API获取95带宽收益
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
      throw new Error(`灵瀚云API调用失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Sync] 灵瀚云API返回:', data);
    
    // 解析数据
    const earningsData = data.data || data;
    
    if (!earningsData || !earningsData.incomeDate) {
      console.log('[Sync] 没有收益数据');
      return NextResponse.json({ 
        success: false, 
        message: '没有收益数据' 
      });
    }
    
    // 存储到数据库（使用 UPSERT）
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
        ${deviceName || deviceId},
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
    
    console.log(`[Sync] ✅ 设备 ${deviceId} 数据已同步`);
    
    return NextResponse.json({
      success: true,
      message: '数据同步成功',
      data: {
        device_id: deviceId,
        income_date: earningsData.incomeDate,
        total_income: earningsData.totalIncome
      }
    });
  } catch (error) {
    console.error('[Sync] 同步失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
