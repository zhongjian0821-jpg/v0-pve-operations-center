import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(request: Request, { params }: { params: { deviceId: string } }) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  
  if (days < 1 || days > 365) {
    return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const query = `
      SELECT 
        device_id,
        wallet_address,
        SUM(daily_income_cny) as total_earnings_cny,
        SUM(daily_income_ashva) as total_earnings_ashva,
        AVG(daily_income_cny) as avg_daily_cny,
        AVG(daily_income_ashva) as avg_daily_ashva,
        COUNT(*) as days_count,
        json_agg(
          json_build_object(
            'income_date', income_date,
            'daily_income_cny', daily_income_cny,
            'daily_income_ashva', daily_income_ashva,
            'flow_gb', flow_gb,
            'fine_cny', fine_cny,
            'fine_ashva', fine_ashva,
            'net_income_ashva', net_income_ashva,
            'ashva_price_usd', ashva_price_usd
          ) ORDER BY income_date DESC
        ) as daily_records
      FROM device_ashva_earnings
      WHERE device_id = $1
        AND income_date >= CURRENT_DATE - INTERVAL '1 day' * $2
      GROUP BY device_id, wallet_address
    `;
    
    const result = await client.query(query, [params.deviceId, days]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No earnings data found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.end();
  }
}
