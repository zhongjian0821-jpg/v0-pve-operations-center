// app/api/admin/execute-migration/route.ts
// 执行数据库迁移 - 创建缺失的表

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('开始执行数据库迁移...');

    // 1. 检查现有表
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    const tableNames = existingTables.map((t: any) => t.table_name);
    console.log(`现有表: ${tableNames.join(', ')}`);

    // 2. 定义需要创建的表
    const requiredTables = [
      'wallets',
      'hierarchy',
      'nodes',
      'assigned_records',
      'commission_records',
      'commission_distribution',
      'member_level_config',
      'withdrawal_records',
      'staking_records'
    ];

    const missingTables = requiredTables.filter(t => !tableNames.includes(t));

    if (missingTables.length === 0) {
      return NextResponse.json({
        success: true,
        message: '所有表都已存在，无需创建',
        existingTables: tableNames
      });
    }

    console.log(`需要创建的表: ${missingTables.join(', ')}`);

    // 3. 创建缺失的表
    const created = [];
    const errors = [];

    for (const tableName of missingTables) {
      try {
        await createTable(tableName);
        created.push(tableName);
        console.log(`✅ ${tableName} 创建成功`);
      } catch (error) {
        console.error(`❌ ${tableName} 创建失败:`, error);
        errors.push({ table: tableName, error: String(error) });
      }
    }

    // 4. 再次检查表
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    return NextResponse.json({
      success: errors.length === 0,
      message: `成功创建 ${created.length} 个表`,
      created,
      errors,
      totalTables: finalTables.length,
      allTables: finalTables.map((t: any) => t.table_name)
    });

  } catch (error) {
    console.error('迁移执行失败:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

async function createTable(tableName: string) {
  switch (tableName) {
    case 'wallets':
      await sql`
        CREATE TABLE wallets (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) UNIQUE NOT NULL,
          ashva_balance DECIMAL(20, 8) DEFAULT 0,
          member_level VARCHAR(20) DEFAULT 'Bronze',
          parent_wallet VARCHAR(42),
          total_referrals INTEGER DEFAULT 0,
          commission_balance DECIMAL(20, 8) DEFAULT 0,
          total_withdrawn DECIMAL(20, 8) DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          last_login_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX idx_wallets_address ON wallets(wallet_address)`;
      await sql`CREATE INDEX idx_wallets_parent ON wallets(parent_wallet)`;
      break;

    case 'hierarchy':
      await sql`
        CREATE TABLE hierarchy (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          parent_wallet VARCHAR(42),
          level INTEGER DEFAULT 0,
          path TEXT,
          direct_referrals INTEGER DEFAULT 0,
          total_team_size INTEGER DEFAULT 0,
          team_volume DECIMAL(20, 8) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX idx_hierarchy_wallet ON hierarchy(wallet_address)`;
      await sql`CREATE INDEX idx_hierarchy_parent ON hierarchy(parent_wallet)`;
      break;

    case 'nodes':
      await sql`
        CREATE TABLE nodes (
          node_id VARCHAR(100) PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          node_type VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          purchase_price DECIMAL(20, 8),
          purchase_date TIMESTAMP DEFAULT NOW(),
          activation_date TIMESTAMP,
          deactivation_date TIMESTAMP,
          total_earned DECIMAL(20, 8) DEFAULT 0,
          is_transferable BOOLEAN DEFAULT true,
          cpu_cores INTEGER,
          memory_gb INTEGER,
          storage_gb INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX idx_nodes_wallet ON nodes(wallet_address)`;
      await sql`CREATE INDEX idx_nodes_type ON nodes(node_type)`;
      await sql`CREATE INDEX idx_nodes_status ON nodes(status)`;
      break;

    case 'assigned_records':
      await sql`
        CREATE TABLE assigned_records (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          node_id VARCHAR(100),
          device_id VARCHAR(100),
          daily_income_ashva DECIMAL(20, 8) DEFAULT 0,
          daily_income_usd DECIMAL(20, 8) DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          last_payout_at TIMESTAMP,
          total_earned DECIMAL(20, 8) DEFAULT 0,
          nodes_count INTEGER DEFAULT 0,
          payout_frequency VARCHAR(20) DEFAULT 'daily',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX idx_assigned_wallet ON assigned_records(wallet_address)`;
      await sql`CREATE INDEX idx_assigned_node ON assigned_records(node_id)`;
      break;

    case 'commission_records':
      await sql`
        CREATE TABLE commission_records (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          from_wallet VARCHAR(42),
          amount DECIMAL(20, 8) NOT NULL,
          commission_level INTEGER,
          commission_type VARCHAR(50),
          node_id VARCHAR(100),
          transaction_id VARCHAR(100),
          status VARCHAR(20) DEFAULT 'completed',
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX idx_commission_rec_wallet ON commission_records(wallet_address)`;
      await sql`CREATE INDEX idx_commission_rec_from ON commission_records(from_wallet)`;
      break;

    case 'commission_distribution':
      await sql`
        CREATE TABLE commission_distribution (
          id SERIAL PRIMARY KEY,
          from_wallet VARCHAR(42) NOT NULL,
          to_wallet VARCHAR(42) NOT NULL,
          level INTEGER NOT NULL,
          percentage DECIMAL(5, 2) NOT NULL,
          amount DECIMAL(20, 8),
          transaction_hash VARCHAR(66),
          status VARCHAR(20) DEFAULT 'pending',
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          processed_at TIMESTAMP
        )
      `;
      await sql`CREATE INDEX idx_commission_dist_from ON commission_distribution(from_wallet)`;
      await sql`CREATE INDEX idx_commission_dist_to ON commission_distribution(to_wallet)`;
      break;

    case 'member_level_config':
      await sql`
        CREATE TABLE member_level_config (
          id SERIAL PRIMARY KEY,
          level_name VARCHAR(20) UNIQUE NOT NULL,
          display_name VARCHAR(50),
          level_order INTEGER DEFAULT 0,
          max_depth INTEGER DEFAULT 10,
          commission_total_percentage DECIMAL(5, 2),
          min_nodes_required INTEGER DEFAULT 0,
          min_team_size INTEGER DEFAULT 0,
          benefits TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX idx_member_level_order ON member_level_config(level_order)`;
      
      // 插入默认数据
      await sql`
        INSERT INTO member_level_config 
          (level_name, display_name, level_order, max_depth, commission_total_percentage, min_nodes_required, min_team_size)
        VALUES
          ('Bronze', '青铜会员', 1, 5, 5.00, 0, 0),
          ('Silver', '白银会员', 2, 7, 7.00, 1, 3),
          ('Gold', '黄金会员', 3, 10, 10.00, 3, 10),
          ('Platinum', '铂金会员', 4, 12, 12.00, 5, 30),
          ('Diamond', '钻石会员', 5, 15, 15.00, 10, 100)
        ON CONFLICT (level_name) DO NOTHING
      `;
      break;

    case 'withdrawal_records':
      await sql`
        CREATE TABLE withdrawal_records (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          amount DECIMAL(20, 8) NOT NULL,
          amount_usd DECIMAL(20, 8),
          fee DECIMAL(20, 8) DEFAULT 0,
          net_amount DECIMAL(20, 8),
          status VARCHAR(20) DEFAULT 'pending',
          transaction_hash VARCHAR(66),
          withdrawal_address VARCHAR(42),
          admin_notes TEXT,
          rejected_reason TEXT,
          processed_by VARCHAR(42),
          processed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX idx_withdrawal_wallet ON withdrawal_records(wallet_address)`;
      await sql`CREATE INDEX idx_withdrawal_status ON withdrawal_records(status)`;
      break;

    case 'staking_records':
      await sql`
        CREATE TABLE staking_records (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          node_id VARCHAR(100),
          staked_amount DECIMAL(20, 8) NOT NULL,
          staked_amount_usd DECIMAL(20, 8),
          reward_rate DECIMAL(5, 2),
          total_rewards DECIMAL(20, 8) DEFAULT 0,
          last_reward_at TIMESTAMP,
          status VARCHAR(20) DEFAULT 'active',
          lock_period_days INTEGER DEFAULT 0,
          unlock_at TIMESTAMP,
          unstake_requested_at TIMESTAMP,
          unstaked_at TIMESTAMP,
          penalty_amount DECIMAL(20, 8) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX idx_staking_wallet ON staking_records(wallet_address)`;
      await sql`CREATE INDEX idx_staking_node ON staking_records(node_id)`;
      break;

    default:
      throw new Error(`Unknown table: ${tableName}`);
  }
}

// GET请求 - 检查表状态
export async function GET(request: NextRequest) {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    const requiredTables = [
      'users',
      'wallets',
      'hierarchy',
      'nodes',
      'assigned_records',
      'commission_records',
      'commission_distribution',
      'member_level_config',
      'withdrawal_records',
      'staking_records',
      'cloud_node_purchases',
      'image_node_purchases',
      'marketplace_listings',
      'marketplace_transactions',
      'ashva_price_history',
      'system_logs'
    ];

    const tableNames = tables.map((t: any) => t.table_name);
    const status = requiredTables.map(table => ({
      table,
      exists: tableNames.includes(table),
      status: tableNames.includes(table) ? '✅' : '❌'
    }));

    const missingCount = status.filter(s => !s.exists).length;

    return NextResponse.json({
      success: true,
      totalTables: tables.length,
      requiredTables: requiredTables.length,
      missingTables: missingCount,
      status,
      allTables: tableNames
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
