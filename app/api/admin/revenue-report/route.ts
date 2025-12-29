// app/api/admin/revenue-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const revenue = await query(`
      SELECT 
        DATE(created_at) as date,
        SUM(purchase_price) as daily_revenue
      FROM nodes
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, []);
    
    return NextResponse.json({ success: true, data: { revenue, period: `${days} days` } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
