import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const results: any = {
      created: [],
      existing: [],
      errors: []
    };

    // 1. 创建 transactions 表
    try {
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
      
      await sql`CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`;
      
      results.created.push('transactions');
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        results.existing.push('transactions');
      } else {
        results.errors.push({ table: 'transactions', error: err.message });
      }
    }

    // 2. 创建 login_logs 表
    try {
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
      
      await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_username ON login_logs(username)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_time ON login_logs(login_time DESC)`;
      
      results.created.push('login_logs');
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        results.existing.push('login_logs');
      } else {
        results.errors.push({ table: 'login_logs', error: err.message });
      }
    }

    return successResponse(results);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // 检查所有表
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    const tableNames = tables.map((t: any) => t.table_name);
    
    const expected = ['admins', 'nodes', 'wallets', 'withdrawals', 'orders', 'transactions', 'login_logs'];
    const missing = expected.filter(t => !tableNames.includes(t));

    return successResponse({
      allTables: tableNames,
      expected,
      existing: tableNames.filter((t: string) => expected.includes(t)),
      missing
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
