import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // 临时：创建缺失的表
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
    } catch (e) {
      console.log('transactions table creation:', e);
    }
    
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
    } catch (e) {
      console.log('login_logs table creation:', e);
    }
    
    // 原有的统计逻辑
    const nodes = await sql`SELECT * FROM nodes`;
    
    const stats = {
      total: nodes.length,
      active: nodes.filter((n: any) => n.status === 'active').length,
      inactive: nodes.filter((n: any) => n.status === 'inactive').length,
      totalEarnings: nodes.reduce((sum: number, n: any) => sum + (Number(n.total_earnings) || 0), 0)
    };

    return successResponse(stats);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
