export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    console.log('Creating commission_config table...');
    
    // 创建表
    await sql`
      CREATE TABLE IF NOT EXISTS commission_config (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        member_level VARCHAR(50) NOT NULL,
        self_rate DECIMAL(5, 2) DEFAULT 0,
        level1_rate DECIMAL(5, 2) DEFAULT 3.0,
        level2_rate DECIMAL(5, 2) DEFAULT 2.0,
        market_partner_rate DECIMAL(5, 2) DEFAULT 10.0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // 创建索引
    await sql`
      CREATE INDEX IF NOT EXISTS idx_commission_config_wallet 
      ON commission_config(wallet_address)
    `;
    
    console.log('Commission config table created successfully');
    
    return successResponse({
      message: 'Commission config table created',
      tables: ['commission_config']
    }, '佣金配置表创建成功');
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return errorResponse(error.message, 500);
  }
}
