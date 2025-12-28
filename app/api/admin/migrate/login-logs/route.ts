import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // 创建 login_logs 表
    await sql`
      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username VARCHAR(100),
        ip_address VARCHAR(45),
        user_agent TEXT,
        login_time TIMESTAMPTZ DEFAULT NOW(),
        success BOOLEAN DEFAULT true,
        failure_reason VARCHAR(255)
      )
    `;

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_username ON login_logs(username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_time ON login_logs(login_time DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_success ON login_logs(success)`;

    return successResponse({
      message: 'Login logs table created successfully',
      table: 'login_logs'
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const check = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'login_logs'
      ) as exists
    `;
    
    return successResponse({
      exists: check[0].exists,
      table: 'login_logs'
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
