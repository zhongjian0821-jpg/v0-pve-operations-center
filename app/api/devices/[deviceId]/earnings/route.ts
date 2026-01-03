import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request, { params }: { params: { deviceId: string } }) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  
  if (days < 1 || days > 365) {
    return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
  }

  try {
    const records = await sql`
      SELECT 
        device_id,
        daily_income_cny,
        daily_income_ashva,
        total_income_cny,
        total_income_ashva,
        flow_gb,
        fine_cny,
        fine_ashva,
        net_income_ashva,
        fine_reason,
        record_date as income_date,
        ashva_price_usd,
        created_at
      FROM assigned_device_daily_records
      WHERE device_id = ${params.deviceId}
        AND record_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY record_date DESC
    `;
    
    if (records.rows.length === 0) {
      return NextResponse.json({ error: 'No earnings data found' }, { status: 404 });
    }
    
    const totalEarningsCny = records.rows.reduce((sum, r) => sum + Number(r.daily_income_cny || 0), 0);
    const totalEarningsAshva = records.rows.reduce((sum, r) => sum + Number(r.daily_income_ashva || 0), 0);
    const avgDailyCny = totalEarningsCny / records.rows.length;
    const avgDailyAshva = totalEarningsAshva / records.rows.length;
    
    const response = {
      device_id: params.deviceId,
      wallet_address: null,
      total_earnings_cny: totalEarningsCny,
      total_earnings_ashva: totalEarningsAshva,
      avg_daily_cny: avgDailyCny,
      avg_daily_ashva: avgDailyAshva,
      days_count: records.rows.length,
      daily_records: records.rows.map(r => ({
        income_date: r.income_date,
        daily_income_cny: Number(r.daily_income_cny || 0),
        daily_income_ashva: Number(r.daily_income_ashva || 0),
        flow_gb: Number(r.flow_gb || 0),
        fine_cny: Number(r.fine_cny || 0),
        fine_ashva: Number(r.fine_ashva || 0),
        net_income_ashva: Number(r.net_income_ashva || 0),
        ashva_price_usd: Number(r.ashva_price_usd || 0)
      }))
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
