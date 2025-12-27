import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // 创建 withdrawals 表
    await sql`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        to_address VARCHAR(42) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        tx_hash VARCHAR(66),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        processed_at TIMESTAMPTZ,
        CONSTRAINT fk_wallet FOREIGN KEY (wallet_address) 
          REFERENCES wallets(wallet_address) ON DELETE CASCADE
      )
    `;

    // 创建索引
    await sql`
      CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet 
      ON withdrawals(wallet_address)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_withdrawals_status 
      ON withdrawals(status)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_withdrawals_created 
      ON withdrawals(created_at DESC)
    `;

    // 检查表是否创建成功
    const check = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'withdrawals'
      ORDER BY ordinal_position
    `;

    return successResponse({
      message: 'Withdrawals table created successfully',
      columns: check
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // 检查表是否存在
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'withdrawals'
      ) as exists
    `;

    if (!tableCheck[0].exists) {
      return successResponse({
        exists: false,
        message: 'Withdrawals table does not exist'
      });
    }

    // 获取表结构
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'withdrawals'
      ORDER BY ordinal_position
    `;

    // 获取索引
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'withdrawals'
    `;

    // 获取记录数
    const count = await sql`
      SELECT COUNT(*) as count FROM withdrawals
    `;

    return successResponse({
      exists: true,
      columns,
      indexes,
      record_count: Number(count[0].count)
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
