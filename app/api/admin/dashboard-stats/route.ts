export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 并行查询所有统计数据
    const [
      usersResult,
      nodesResult,
      ordersResult,
      withdrawalsResult,
      revenueResult
    ] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM wallets`, []),
      query(`SELECT COUNT(*) as total FROM nodes`, []),
      query(`SELECT COUNT(*) as total FROM nodes WHERE node_type IN ('cloud', 'image')`, []),
      query(`SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount FROM withdrawals`, []),
      query(`SELECT COALESCE(SUM(purchase_price), 0) as total FROM nodes WHERE status IN ('active', 'running')`, [])
    ]);

    // 查询会员等级分布
    const levelDistResult = await query(
      `SELECT member_level, COUNT(*) as count
      FROM wallets
      GROUP BY member_level`,
      []
    );

    const levelDistribution: Record<string, number> = {};
    levelDistResult.forEach((row: any) => {
      levelDistribution[row.member_level || 'normal'] = parseInt(row.count || '0');
    });

    // 查询最近30天的收益趋势
    const earningsTrendResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_earnings), 0) as earnings
      FROM nodes
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30`,
      []
    );

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: parseInt(usersResult[0]?.total || '0'),
        totalNodes: parseInt(nodesResult[0]?.total || '0'),
        totalOrders: parseInt(ordersResult[0]?.total || '0'),
        totalWithdrawals: parseInt(withdrawalsResult[0]?.total || '0'),
        totalRevenue: parseFloat(revenueResult[0]?.total || '0'),
        withdrawalAmount: parseFloat(withdrawalsResult[0]?.total_amount || '0'),
        levelDistribution: levelDistribution,
        earningsTrend: earningsTrendResult.map((r: any) => ({
          date: r.date,
          earnings: parseFloat(r.earnings || '0')
        }))
      }
    });

  } catch (error: any) {
    console.error('[API] 仪表板统计查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
