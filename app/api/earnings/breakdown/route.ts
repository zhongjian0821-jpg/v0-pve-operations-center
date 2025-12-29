// app/api/earnings/breakdown/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const days = parseInt(searchParams.get('days') || '30');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    // 查询每日收益明细
    const dailyEarnings = await query(`
      SELECT 
        record_date,
        device_id,
        daily_income_ashva,
        daily_fine_ashva,
        net_income_ashva
      FROM assigned_records
      WHERE LOWER(wallet_address) = LOWER($1)
        AND record_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY record_date DESC
    `, [address]);

    // 按日期聚合
    const byDate: { [key: string]: number } = {};
    dailyEarnings.forEach((record: any) => {
      const date = record.record_date.toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + parseFloat(record.net_income_ashva || '0');
    });

    return NextResponse.json({
      success: true,
      data: {
        records: dailyEarnings,
        byDate: byDate,
        period: `${days} days`
      }
    });

  } catch (error: any) {
    console.error('[API] 收益明细查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
