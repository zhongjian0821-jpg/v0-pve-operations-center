// app/api/admin/migrate-web3-data/route.ts
// 从Web3会员中心迁移数据到PVE，并提供管理界面

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET - 检查Web3数据库状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      // 检查数据库的数据状态
      const web3Tables = [
        'wallets',
        'hierarchy', 
        'nodes',
        'assigned_records',
        'commission_records',
        'commission_distribution',
        'member_level_config',
        'withdrawal_records',
        'staking_records',
      ];

      const status = [];

      for (const table of web3Tables) {
        try {
          const countQuery = `SELECT COUNT(*) as count FROM ${table}`;
          const countResult = await sql.unsafe(countQuery);
          const count = parseInt(String(countResult[0]?.count || '0'));

          status.push({
            table,
            web3_rows: count,
            pve_rows: count, // 同一个数据库
            needs_migration: false,
            difference: 0,
          });
        } catch (error) {
          status.push({
            table,
            error: String(error),
            web3_rows: 0,
            pve_rows: 0,
            needs_migration: false,
            difference: 0,
          });
        }
      }

      return NextResponse.json({
        success: true,
        status,
        summary: {
          total_tables: status.length,
          tables_with_data: status.filter((s: any) => s.web3_rows > 0).length,
          tables_need_migration: status.filter((s: any) => s.needs_migration).length,
        },
        message: 'Web3和PVE使用相同的数据库，数据已共享',
      });
    }

    if (action === 'preview') {
      // 预览数据
      const table = searchParams.get('table');
      const limit = parseInt(searchParams.get('limit') || '10');

      if (!table) {
        return NextResponse.json({
          success: false,
          error: 'table parameter required',
        }, { status: 400 });
      }

      const query = `SELECT * FROM ${table} LIMIT ${limit}`;
      const data = await sql.unsafe(query);

      return NextResponse.json({
        success: true,
        table,
        count: data.length,
        data,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });

  } catch (error) {
    console.error('检查数据失败:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

// POST - 执行数据迁移（实际上不需要，因为是同一个数据库）
export async function POST(request: NextRequest) {
  try {
    const { table, mode } = await request.json();

    return NextResponse.json({
      success: true,
      table,
      mode,
      migrated: 0,
      skipped: 0,
      errors: 0,
      message: 'Web3和PVE使用相同的数据库，无需迁移',
    });

  } catch (error) {
    console.error('操作失败:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
