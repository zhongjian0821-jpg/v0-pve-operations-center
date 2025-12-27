import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    console.log('[DB Init] 开始初始化数据库...');

    // 1. wallets表
    await sql`
      CREATE TABLE IF NOT EXISTS wallets (
        wallet_address VARCHAR(42) PRIMARY KEY,
        ashva_balance NUMERIC(20, 8) DEFAULT 0,
        member_level VARCHAR(20) DEFAULT 'normal',
        commission_rate_level1 DECIMAL DEFAULT 3.0,
        commission_rate_level2 DECIMAL DEFAULT 2.0,
        parent_wallet VARCHAR(42),
        team_size INTEGER DEFAULT 0,
        total_earnings NUMERIC(20, 8) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('[DB Init] ✅ wallets表创建完成');

    // 2. hierarchy表
    await sql`
      CREATE TABLE IF NOT EXISTS hierarchy (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42),
        parent_wallet VARCHAR(42),
        level INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('[DB Init] ✅ hierarchy表创建完成');

    // 3. commission_records表
    await sql`
      CREATE TABLE IF NOT EXISTS commission_records (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42),
        from_wallet VARCHAR(42),
        amount NUMERIC(20, 8),
        commission_level INTEGER,
        transaction_type VARCHAR(50),
        source_node_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('[DB Init] ✅ commission_records表创建完成');

    // 4. commission_distribution表
    await sql`
      CREATE TABLE IF NOT EXISTS commission_distribution (
        wallet_address VARCHAR(42) PRIMARY KEY,
        level_1_percentage DECIMAL,
        level_2_percentage DECIMAL,
        level_3_percentage DECIMAL,
        level_4_percentage DECIMAL,
        level_5_percentage DECIMAL,
        level_6_percentage DECIMAL,
        level_7_percentage DECIMAL,
        level_8_percentage DECIMAL,
        level_9_percentage DECIMAL,
        level_10_percentage DECIMAL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('[DB Init] ✅ commission_distribution表创建完成');

    // 5. pending_assignments表
    await sql`
      CREATE TABLE IF NOT EXISTS pending_assignments (
        id SERIAL PRIMARY KEY,
        node_id VARCHAR(50) UNIQUE,
        wallet_address VARCHAR(42),
        product_type VARCHAR(20),
        tx_hash VARCHAR(66),
        cpu_cores INTEGER,
        memory_gb INTEGER,
        storage_gb INTEGER,
        amount_ashva NUMERIC(20, 8),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        assigned_at TIMESTAMP,
        assigned_by VARCHAR(42)
      )
    `;
    console.log('[DB Init] ✅ pending_assignments表创建完成');

    // 6. assigned_records表
    await sql`
      CREATE TABLE IF NOT EXISTS assigned_records (
        id SERIAL PRIMARY KEY,
        node_id VARCHAR(50) UNIQUE,
        pve_node_id VARCHAR(50),
        vm_id INTEGER,
        ip_address VARCHAR(45),
        device_name VARCHAR(100),
        online_status VARCHAR(20) DEFAULT 'offline',
        total_income NUMERIC(20, 8) DEFAULT 0,
        daily_income NUMERIC(20, 8) DEFAULT 0,
        last_online_at TIMESTAMP,
        assigned_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('[DB Init] ✅ assigned_records表创建完成');

    // 7. earnings_history表
    await sql`
      CREATE TABLE IF NOT EXISTS earnings_history (
        id SERIAL PRIMARY KEY,
        node_id VARCHAR(50),
        date DATE,
        daily_income NUMERIC(20, 8),
        online_hours DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_earnings_node_date 
      ON earnings_history(node_id, date)
    `;
    console.log('[DB Init] ✅ earnings_history表创建完成');

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_wallets_parent ON wallets(parent_wallet)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_hierarchy_wallet ON hierarchy(wallet_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_hierarchy_parent ON hierarchy(parent_wallet)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_commission_wallet ON commission_records(wallet_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_commission_from ON commission_records(from_wallet)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assignments_wallet ON pending_assignments(wallet_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assigned_node ON assigned_records(node_id)`;
    console.log('[DB Init] ✅ 索引创建完成');

    return successResponse({
      message: '数据库初始化成功',
      tables_created: [
        'wallets',
        'hierarchy',
        'commission_records',
        'commission_distribution',
        'pending_assignments',
        'assigned_records',
        'earnings_history'
      ]
    });
  } catch (error: any) {
    console.error('[DB Init] 错误:', error);
    return errorResponse(error.message, 500);
  }
}
