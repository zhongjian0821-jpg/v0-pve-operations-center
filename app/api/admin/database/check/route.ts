import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // 1. 获取所有表
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    const tableNames = tables.map((t: any) => t.table_name);
    const tableDetails: any = {};

    // 2. 获取每个表的详细信息
    for (const table of tables) {
      const tableName = table.table_name;

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

      // 获取行数 - 根据表名分别查询
      let rowCount = 0;
      
      if (tableName === 'admins') {
        const result = await sql`SELECT COUNT(*) as count FROM admins`;
        rowCount = Number(result[0].count);
      } else if (tableName === 'nodes') {
        const result = await sql`SELECT COUNT(*) as count FROM nodes`;
        rowCount = Number(result[0].count);
      } else if (tableName === 'wallets') {
        const result = await sql`SELECT COUNT(*) as count FROM wallets`;
        rowCount = Number(result[0].count);
      } else if (tableName === 'withdrawals') {
        const result = await sql`SELECT COUNT(*) as count FROM withdrawals`;
        rowCount = Number(result[0].count);
      } else if (tableName === 'orders') {
        const result = await sql`SELECT COUNT(*) as count FROM orders`;
        rowCount = Number(result[0].count);
      } else if (tableName === 'transactions') {
        const result = await sql`SELECT COUNT(*) as count FROM transactions`;
        rowCount = Number(result[0].count);
      } else if (tableName === 'login_logs') {
        const result = await sql`SELECT COUNT(*) as count FROM login_logs`;
        rowCount = Number(result[0].count);
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
