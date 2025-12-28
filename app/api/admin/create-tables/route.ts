import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // 直接创建 transactions 表
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        tx_hash VARCHAR(66),
        from_address VARCHAR(42),
        to_address VARCHAR(42),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC)`;

    // 直接创建 login_logs 表
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

    // 验证表是否存在
    const check = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('transactions', 'login_logs')
      ORDER BY table_name
    `;

    const created = check.map((t: any) => t.table_name);

    return successResponse({
      message: 'Tables created successfully',
      created,
      success: created.length === 2
    });
  } catch (error: any) {
    console.error('Table creation error:', error);
    return errorResponse(`Failed to create tables: ${error.message}`, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // 检查表是否存在
    const check = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('transactions', 'login_logs')
      ORDER BY table_name
    `;

    const existing = check.map((t: any) => t.table_name);
    const missing = ['transactions', 'login_logs'].filter(t => !existing.includes(t));

    return successResponse({
      existing,
      missing,
      allCreated: missing.length === 0
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
