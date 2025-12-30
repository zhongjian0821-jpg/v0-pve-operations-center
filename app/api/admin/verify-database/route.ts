// app/api/admin/verify-database/route.ts
// 详细验证PVE数据库表结构和数据

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('开始验证数据库...');

    const verification = {
      timestamp: new Date().toISOString(),
      summary: {},
      tables: [],
      indexes: [],
      data_samples: [],
      issues: [],
    };

    // 1. 获取所有表
    const tables = await sql`
      SELECT 
        table_name,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    verification.summary = {
      total_tables: tables.length,
      public_tables: tables.filter((t: any) => t.table_schema === 'public').length,
    };

    // 2. 检查每个表的详细信息
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
          WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          ORDER BY ordinal_position
        `;

        // 获取行数
        const countResult = await sql`
          SELECT COUNT(*) as count 
          FROM ${sql(tableName)}
        `;
        const rowCount = parseInt(countResult[0]?.count || '0');

        // 获取索引
        const indexes = await sql`
          SELECT 
            indexname,
            indexdef
          FROM pg_indexes
          WHERE schemaname = 'public' 
            AND tablename = ${tableName}
        `;

        // 获取表大小
        const sizeResult = await sql`
          SELECT pg_size_pretty(pg_total_relation_size(${tableName}::regclass)) as size
        `;

        verification.tables.push({
          name: tableName,
          columns: columns.length,
          rows: rowCount,
          size: sizeResult[0]?.size || 'N/A',
          indexes: indexes.length,
          column_details: columns.map((col: any) => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default,
          })),
          index_details: indexes.map((idx: any) => ({
            name: idx.indexname,
            definition: idx.indexdef,
          })),
        });

      } catch (error) {
        verification.issues.push({
          table: tableName,
          error: String(error),
        });
      }
    }

    // 3. 检查必需的表
    const requiredTables = [
      'users',
      'wallets',
      'hierarchy',
      'nodes',
      'assigned_records',
      'commission_records',
      'commission_distribution',
      'member_level_config',
      'withdrawal_records',
      'staking_records',
      'cloud_node_purchases',
      'image_node_purchases',
      'marketplace_listings',
      'marketplace_transactions',
      'ashva_price_history',
      'system_logs',
    ];

    const existingTableNames = tables.map((t: any) => t.table_name);
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));

    if (missingTables.length > 0) {
      verification.issues.push({
        type: 'missing_tables',
        tables: missingTables,
      });
    }

    // 4. 获取一些示例数据（每个表最多3行）
    for (const table of verification.tables.slice(0, 10)) { // 只取前10个表
      if (table.rows > 0) {
        try {
          const samples = await sql`
            SELECT * FROM ${sql(table.name)}
            LIMIT 3
          `;
          
          verification.data_samples.push({
            table: table.name,
            sample_count: samples.length,
            samples: samples,
          });
        } catch (error) {
          // 忽略错误
        }
      }
    }

    // 5. 生成健康报告
    const healthReport = {
      status: verification.issues.length === 0 ? 'healthy' : 'issues_found',
      total_tables: verification.tables.length,
      total_rows: verification.tables.reduce((sum: number, t: any) => sum + t.rows, 0),
      tables_with_data: verification.tables.filter((t: any) => t.rows > 0).length,
      tables_without_data: verification.tables.filter((t: any) => t.rows === 0).length,
      missing_tables: missingTables,
      issues_count: verification.issues.length,
    };

    return NextResponse.json({
      success: true,
      health: healthReport,
      verification,
    });

  } catch (error) {
    console.error('数据库验证失败:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

// POST - 详细表结构验证
export async function POST(request: NextRequest) {
  try {
    const { table_name } = await request.json();

    if (!table_name) {
      return NextResponse.json({
        success: false,
        error: 'table_name is required',
      }, { status: 400 });
    }

    // 获取表的详细信息
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = ${table_name}
      ORDER BY ordinal_position
    `;

    // 获取约束
    const constraints = await sql`
      SELECT
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = ${table_name}
    `;

    // 获取外键
    const foreignKeys = await sql`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.key_column_usage AS kcu
      JOIN information_schema.constraint_column_usage AS ccu
        ON kcu.constraint_name = ccu.constraint_name
      JOIN information_schema.table_constraints AS tc
        ON kcu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND kcu.table_schema = 'public'
        AND kcu.table_name = ${table_name}
    `;

    // 获取索引
    const indexes = await sql`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' 
        AND tablename = ${table_name}
    `;

    // 获取表数据统计
    const stats = await sql`
      SELECT 
        COUNT(*) as total_rows,
        pg_size_pretty(pg_total_relation_size(${table_name}::regclass)) as total_size,
        pg_size_pretty(pg_relation_size(${table_name}::regclass)) as table_size,
        pg_size_pretty(pg_indexes_size(${table_name}::regclass)) as indexes_size
      FROM ${sql(table_name)}
    `;

    // 获取示例数据
    const samples = await sql`
      SELECT * FROM ${sql(table_name)}
      LIMIT 5
    `;

    return NextResponse.json({
      success: true,
      table: table_name,
      structure: {
        columns: columns,
        constraints: constraints,
        foreign_keys: foreignKeys,
        indexes: indexes,
      },
      statistics: stats[0],
      sample_data: samples,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
