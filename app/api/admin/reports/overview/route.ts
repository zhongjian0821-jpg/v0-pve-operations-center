import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 获取综合统计数据
    const stats = await Promise.all([
      query('SELECT COUNT(*) as total FROM wallets', []),
      query('SELECT COUNT(*) as total FROM nodes', []),
      query('SELECT COUNT(*) as total FROM orders', []),
      query("SELECT SUM(amount) as total FROM withdrawals WHERE status = $1", ['completed']),
      query('SELECT SUM(ashva_balance) as total FROM wallets', []),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: parseInt(stats[0][0]?.total || '0'),
        totalNodes: parseInt(stats[1][0]?.total || '0'),
        totalOrders: parseInt(stats[2][0]?.total || '0'),
        totalWithdrawals: parseFloat(stats[3][0]?.total || '0'),
        totalAshvaBalance: parseFloat(stats[4][0]?.total || '0'),
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}