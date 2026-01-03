import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // 测试数据库连接
    const result = await sql`SELECT NOW() as current_time`;
    
    return NextResponse.json({
      success: true,
      message: '数据库连接正常',
      database_time: result[0]?.current_time,
      env_check: {
        has_database_url: !!process.env.DATABASE_URL,
        database_url_prefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
