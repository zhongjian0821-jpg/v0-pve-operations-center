import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // 创建 transactions 表
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

    return successResponse({
      message: 'Transactions table created successfully',
      table: 'transactions'
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
        AND table_name = 'transactions'
      ) as exists
    `;
    
    return successResponse({
      exists: check[0].exists,
      table: 'transactions'
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
