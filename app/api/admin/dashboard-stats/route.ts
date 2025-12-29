// app/api/admin/dashboard-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const [users, nodes, orders, withdrawals, earnings] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM wallets`, []),
      query(`SELECT COUNT(*) as count FROM nodes`, []),
      query(`SELECT COUNT(*) as count FROM orders`, []),
      query(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM withdrawals`, []),
      query(`SELECT COALESCE(SUM(total_earnings), 0) as total FROM wallets`, [])
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: parseInt(users[0].count),
        totalNodes: parseInt(nodes[0].count),
        totalOrders: parseInt(orders[0].count),
        totalWithdrawals: parseInt(withdrawals[0].count),
        totalWithdrawalAmount: parseFloat(withdrawals[0].total),
        totalEarnings: parseFloat(earnings[0].total)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}