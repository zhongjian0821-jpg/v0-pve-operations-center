import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // 获取所有表
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    const tableNames = tables.map((t: any) => t.table_name);
    const tableDetails: any = {};

    // 获取每个表的详细信息
    for (const table of tables) {
      const tableName = table.table_name;

      try {
        // 获取列信息
        const columns = await sql`
          SELECT 
            column_name, 
            data_type, 
            character_maximum_length,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `;

        // 获取行数 - 针对每个表单独查询
        let rowCount = 0;
        
        // 直接查询，不用动态表名
        if (tableName === 'admins') {
          const c = await sql`SELECT COUNT(*) as count FROM admins`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'nodes') {
          const c = await sql`SELECT COUNT(*) as count FROM nodes`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'wallets') {
          const c = await sql`SELECT COUNT(*) as count FROM wallets`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'withdrawals') {
          const c = await sql`SELECT COUNT(*) as count FROM withdrawals`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'orders') {
          const c = await sql`SELECT COUNT(*) as count FROM orders`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'transactions') {
          const c = await sql`SELECT COUNT(*) as count FROM transactions`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'login_logs') {
          const c = await sql`SELECT COUNT(*) as count FROM login_logs`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'assigned_records') {
          const c = await sql`SELECT COUNT(*) as count FROM assigned_records`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'commission_distribution') {
          const c = await sql`SELECT COUNT(*) as count FROM commission_distribution`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'commission_records') {
          const c = await sql`SELECT COUNT(*) as count FROM commission_records`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'hierarchy') {
          const c = await sql`SELECT COUNT(*) as count FROM hierarchy`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'member_level_config') {
          const c = await sql`SELECT COUNT(*) as count FROM member_level_config`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'node_listings') {
          const c = await sql`SELECT COUNT(*) as count FROM node_listings`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'operation_logs') {
          const c = await sql`SELECT COUNT(*) as count FROM operation_logs`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'staking_records') {
          const c = await sql`SELECT COUNT(*) as count FROM staking_records`;
          rowCount = Number(c[0].count);
        } else if (tableName === 'withdrawal_records') {
          const c = await sql`SELECT COUNT(*) as count FROM withdrawal_records`;
          rowCount = Number(c[0].count);
        }

        tableDetails[tableName] = {
          columns: columns.map((c: any) => ({
            name: c.column_name,
            type: c.data_type,
            maxLength: c.character_maximum_length,
            nullable: c.is_nullable === 'YES',
            default: c.column_default
          })),
          rowCount
        };
      } catch (err: any) {
        console.error(`Error querying table ${tableName}:`, err.message);
        tableDetails[tableName] = {
          columns: [],
          rowCount: 0,
          error: err.message
        };
      }
    }

    return successResponse({
      tables: tableNames,
      details: tableDetails,
      totalTables: tableNames.length
    });
  } catch (error: any) {
    console.error('Database check error:', error);
    return errorResponse(error.message, 500);
  }
}
