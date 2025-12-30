// app/api/admin/data-overview/route.ts
// 简单的数据查看API

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const tables = [
      'wallets',
      'hierarchy',
      'nodes',
      'assigned_records',
      'commission_records',
      'withdrawal_records',
      'staking_records',
    ];

    const overview = [];

    for (const table of tables) {
      try {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        overview.push({
          table,
          count: parseInt(result[0]?.count || '0'),
        });
      } catch (error) {
        overview.push({
          table,
          count: 0,
          error: 'Table not found',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: overview,
      totalRows: overview.reduce((sum, t) => sum + t.count, 0),
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
