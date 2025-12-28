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

    // 获取每个表的列信息
    const tableDetails: any = {};

    for (const tableName of tableNames) {
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

      // 获取行数
      const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = Number(countResult[0].count);

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
    return errorResponse(error.message, 500);
  }
}
