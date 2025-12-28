import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  const results = [];
  
  // 创建 transactions 表
  try {
    const r1 = await sql`
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
    
    results.push({ table: 'transactions', status: 'success' });
  } catch (e: any) {
    results.push({ table: 'transactions', status: 'error', error: e.message });
  }
  
  // 创建 login_logs 表
  try {
    const r2 = await sql`
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
    await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_time ON login_logs(login_time DESC)`;
    
    results.push({ table: 'login_logs', status: 'success' });
  } catch (e: any) {
    results.push({ table: 'login_logs', status: 'error', error: e.message });
  }
  
  // 验证
  const check = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('transactions', 'login_logs')
    ORDER BY table_name
  `;
  
  return Response.json({
    success: true,
    results,
    verified: check.map((t: any) => t.table_name),
    total: check.length
  });
}

export async function GET(request: NextRequest) {
  const check = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('transactions', 'login_logs')
    ORDER BY table_name
  `;
  
  const existing = check.map((t: any) => t.table_name);
  
  return Response.json({
    existing,
    missing: ['transactions', 'login_logs'].filter(t => !existing.includes(t))
  });
}
