import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { deviceId: string } }) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  
  if (days < 1 || days > 365) {
    return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
  }

  try {
    console.log('[Earnings API] 查询设备:', params.deviceId, '天数:', days);
    
    const records = await sql`
      SELECT 
        device_id,
        device_name,
        income_date,
        total_income,
        flow,
        fine,
        fine_reason,
        status,
        synced_at
      FROM linghan_device_daily_earnings
      WHERE device_id = ${params.deviceId}
        AND income_date >= CURRENT_DATE - ${days}::integer
      ORDER BY income_date DESC
    `;
    
    console.log('[Earnings API] 找到', records.length, '条记录');
    
    const totalEarnings = records.reduce((sum, r) => sum + Number(r.total_income || 0), 0);
    const avgDaily = records.length > 0 ? totalEarnings / records.length : 0;
    
    const response = {
      device_id: params.deviceId,
      total_earnings: totalEarnings,
      avg_daily: avgDaily,
      days_count: records.length,
      daily_records: records.map(r => ({
        income_date: r.income_date,
        total_income: Number(r.total_income || 0),
        flow: Number(r.flow || 0),
        fine: Number(r.fine || 0),
        fine_reason: r.fine_reason || '',
        status: r.status,
        status_text: r.status === 1 ? '已结算' : '待结算'
      }))
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Earnings API] 错误:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        device_id: params.deviceId,
        total_earnings: 0,
        avg_daily: 0,
        days_count: 0,
        daily_records: []
      }, 
      { status: 200 }
    );
  }
}
