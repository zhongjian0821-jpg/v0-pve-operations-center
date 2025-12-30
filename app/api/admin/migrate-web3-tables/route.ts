export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    console.log('开始迁移 Web3 会员中心数据表...');
    
    const results = [];
    
    // 1. 创建 hierarchy 表
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS hierarchy (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          parent_wallet VARCHAR(42),
          level INTEGER NOT NULL DEFAULT 1,
          path TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT fk_hierarchy_wallet FOREIGN KEY (wallet_address) 
              REFERENCES wallets(wallet_address) ON DELETE CASCADE,
          CONSTRAINT fk_hierarchy_parent FOREIGN KEY (parent_wallet) 
              REFERENCES wallets(wallet_address) ON DELETE CASCADE
        )
      `;
      
      await sql`CREATE INDEX IF NOT EXISTS idx_hierarchy_wallet ON hierarchy(wallet_address)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_hierarchy_parent ON hierarchy(parent_wallet)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_hierarchy_level ON hierarchy(level)`;
      
      results.push('✅ hierarchy 表创建成功');
    } catch (e: any) {
      results.push(`⚠️ hierarchy: ${e.message}`);
    }
    
    // 2. 创建 nodes 表
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS nodes (
          node_id VARCHAR(100) PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          node_type VARCHAR(20) NOT NULL CHECK (node_type IN ('cloud', 'image')),
          status VARCHAR(20) DEFAULT 'pending' NOT NULL 
              CHECK (status IN ('pending', 'active', 'inactive', 'deploying')),
          purchase_price DECIMAL(20, 8) NOT NULL,
          staking_amount DECIMAL(20, 8) DEFAULT 0,
          total_earnings DECIMAL(20, 8) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          activated_at TIMESTAMP,
          CONSTRAINT fk_nodes_wallet FOREIGN KEY (wallet_address) 
              REFERENCES wallets(wallet_address) ON DELETE CASCADE
        )
      `;
      
      await sql`CREATE INDEX IF NOT EXISTS idx_nodes_wallet ON nodes(wallet_address)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status)`;
      
      results.push('✅ nodes 表创建成功');
    } catch (e: any) {
      results.push(`⚠️ nodes: ${e.message}`);
    }
    
    // 3. 创建 assigned_records 表
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS assigned_records (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          node_id VARCHAR(100),
          device_id VARCHAR(100) NOT NULL,
          daily_income_ashva DECIMAL(20, 8) DEFAULT 0,
          daily_fine_ashva DECIMAL(20, 8) DEFAULT 0,
          net_income_ashva DECIMAL(20, 8) DEFAULT 0,
          daily_flow_gb DECIMAL(10, 2) DEFAULT 0,
          record_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT fk_assigned_wallet FOREIGN KEY (wallet_address) 
              REFERENCES wallets(wallet_address) ON DELETE CASCADE,
          CONSTRAINT fk_assigned_node FOREIGN KEY (node_id) 
              REFERENCES nodes(node_id) ON DELETE SET NULL
        )
      `;
      
      await sql`CREATE INDEX IF NOT EXISTS idx_assigned_wallet ON assigned_records(wallet_address)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_assigned_node ON assigned_records(node_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_assigned_date ON assigned_records(record_date DESC)`;
      
      results.push('✅ assigned_records 表创建成功');
    } catch (e: any) {
      results.push(`⚠️ assigned_records: ${e.message}`);
    }
    
    // 4. 创建 member_level_config 表
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS member_level_config (
          id SERIAL PRIMARY KEY,
          level_name VARCHAR(50) UNIQUE NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          max_depth INTEGER NOT NULL,
          commission_total_percentage DECIMAL(5, 2) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      // 插入默认配置
      await sql`
        INSERT INTO member_level_config (level_name, display_name, max_depth, commission_total_percentage, description)
        VALUES 
          ('normal', '普通会员', 2, 5, '直推3% + 间推2%'),
          ('market_partner', '市场合伙人', 20, 15, '15%总收益，10%额外收益权'),
          ('global_partner', '全球合伙人', 100, 20, '20%总收益，5%额外收益权')
        ON CONFLICT (level_name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          max_depth = EXCLUDED.max_depth,
          commission_total_percentage = EXCLUDED.commission_total_percentage,
          description = EXCLUDED.description
      `;
      
      results.push('✅ member_level_config 表创建成功');
    } catch (e: any) {
      results.push(`⚠️ member_level_config: ${e.message}`);
    }
    
    // 5. 创建 commission_distribution 表
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS commission_distribution (
          id SERIAL PRIMARY KEY,
          from_wallet VARCHAR(42) NOT NULL,
          to_wallet VARCHAR(42) NOT NULL,
          level INTEGER NOT NULL,
          percentage DECIMAL(5, 2) NOT NULL,
          rate DECIMAL(5, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT fk_commission_from FOREIGN KEY (from_wallet) 
              REFERENCES wallets(wallet_address) ON DELETE CASCADE,
          CONSTRAINT fk_commission_to FOREIGN KEY (to_wallet) 
              REFERENCES wallets(wallet_address) ON DELETE CASCADE,
          CONSTRAINT unique_commission_config UNIQUE (from_wallet, to_wallet, level)
        )
      `;
      
      await sql`CREATE INDEX IF NOT EXISTS idx_commission_from ON commission_distribution(from_wallet)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_commission_to ON commission_distribution(to_wallet)`;
      
      results.push('✅ commission_distribution 表创建成功');
    } catch (e: any) {
      results.push(`⚠️ commission_distribution: ${e.message}`);
    }
    
    // 6. 创建 commission_records 表
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS commission_records (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          from_wallet VARCHAR(42),
          amount DECIMAL(20, 8) NOT NULL,
          commission_level INTEGER,
          transaction_type VARCHAR(50) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT fk_commission_wallet FOREIGN KEY (wallet_address) 
              REFERENCES wallets(wallet_address) ON DELETE CASCADE,
          CONSTRAINT fk_commission_from_wallet FOREIGN KEY (from_wallet) 
              REFERENCES wallets(wallet_address) ON DELETE SET NULL
        )
      `;
      
      await sql`CREATE INDEX IF NOT EXISTS idx_commission_wallet ON commission_records(wallet_address)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_commission_created ON commission_records(created_at DESC)`;
      
      results.push('✅ commission_records 表创建成功');
    } catch (e: any) {
      results.push(`⚠️ commission_records: ${e.message}`);
    }
    
    // 7. 创建 node_listings 表
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS node_listings (
          listing_id SERIAL PRIMARY KEY,
          node_id VARCHAR(100) NOT NULL,
          seller_wallet VARCHAR(42) NOT NULL,
          buyer_wallet VARCHAR(42),
          asking_price DECIMAL(20, 8) NOT NULL,
          status VARCHAR(20) DEFAULT 'active' NOT NULL 
              CHECK (status IN ('active', 'sold', 'cancelled')),
          created_at TIMESTAMP DEFAULT NOW(),
          sold_at TIMESTAMP,
          CONSTRAINT fk_listing_node FOREIGN KEY (node_id) 
              REFERENCES nodes(node_id) ON DELETE CASCADE,
          CONSTRAINT fk_listing_seller FOREIGN KEY (seller_wallet) 
              REFERENCES wallets(wallet_address) ON DELETE CASCADE,
          CONSTRAINT fk_listing_buyer FOREIGN KEY (buyer_wallet) 
              REFERENCES wallets(wallet_address) ON DELETE SET NULL
        )
      `;
      
      await sql`CREATE INDEX IF NOT EXISTS idx_listing_node ON node_listings(node_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_listing_status ON node_listings(status)`;
      
      results.push('✅ node_listings 表创建成功');
    } catch (e: any) {
      results.push(`⚠️ node_listings: ${e.message}`);
    }
    
    // 8. 创建 staking_records 表
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS staking_records (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          node_id VARCHAR(100),
          staked_amount DECIMAL(20, 8) NOT NULL,
          staked_amount_usd DECIMAL(20, 2),
          lock_period_days INTEGER NOT NULL,
          unlock_date TIMESTAMP NOT NULL,
          status VARCHAR(20) DEFAULT 'locked' NOT NULL 
              CHECK (status IN ('locked', 'unlocked', 'withdrawn')),
          rewards_earned DECIMAL(20, 8) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          withdrawn_at TIMESTAMP,
          CONSTRAINT fk_staking_wallet FOREIGN KEY (wallet_address) 
              REFERENCES wallets(wallet_address) ON DELETE CASCADE,
          CONSTRAINT fk_staking_node FOREIGN KEY (node_id) 
              REFERENCES nodes(node_id) ON DELETE SET NULL
        )
      `;
      
      await sql`CREATE INDEX IF NOT EXISTS idx_staking_wallet ON staking_records(wallet_address)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_staking_status ON staking_records(status)`;
      
      results.push('✅ staking_records 表创建成功');
    } catch (e: any) {
      results.push(`⚠️ staking_records: ${e.message}`);
    }
    
    console.log('表结构迁移完成');
    
    return successResponse({
      message: '数据表迁移完成',
      results,
      tables: [
        'hierarchy',
        'nodes',
        'assigned_records',
        'member_level_config',
        'commission_distribution',
        'commission_records',
        'node_listings',
        'staking_records'
      ]
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return errorResponse(error.message, 500);
  }
}
