import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  try {
    console.log('开始执行数据库迁移...')

    // 1. 创建 commission_records 表
    await sql`
      CREATE TABLE IF NOT EXISTS commission_records (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        commission_level INTEGER NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        from_wallet VARCHAR(42),
        from_node_id VARCHAR(50),
        node_type VARCHAR(20),
        purchase_amount DECIMAL(20, 8),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log('✅ commission_records 表创建成功')

    //创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_commission_wallet ON commission_records(LOWER(wallet_address))`
    await sql`CREATE INDEX IF NOT EXISTS idx_commission_level ON commission_records(commission_level)`
    await sql`CREATE INDEX IF NOT EXISTS idx_commission_from ON commission_records(LOWER(from_wallet))`
    await sql`CREATE INDEX IF NOT EXISTS idx_commission_created ON commission_records(created_at DESC)`

    // 2. 创建 withdrawal_records 表
    await sql`
      CREATE TABLE IF NOT EXISTS withdrawal_records (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        burn_amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
        actual_amount DECIMAL(20, 8) NOT NULL,
        burn_rate DECIMAL(5, 4),
        ashva_price DECIMAL(15, 8),
        amount_usd DECIMAL(15, 2),
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        transaction_hash VARCHAR(66),
        approved_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `
    console.log('✅ withdrawal_records 表创建成功')

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_withdrawal_wallet ON withdrawal_records(LOWER(wallet_address))`
    await sql`CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_records(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_withdrawal_created ON withdrawal_records(created_at DESC)`

    // 3. 创建 team_tree 表
    await sql`
      CREATE TABLE IF NOT EXISTS team_tree (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        parent_wallet VARCHAR(42),
        level INTEGER DEFAULT 1,
        path TEXT,
        root_wallet VARCHAR(42),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log('✅ team_tree 表创建成功')

    // 创建索引和唯一约束
    await sql`CREATE INDEX IF NOT EXISTS idx_team_wallet ON team_tree(LOWER(wallet_address))`
    await sql`CREATE INDEX IF NOT EXISTS idx_team_parent ON team_tree(LOWER(parent_wallet))`
    await sql`CREATE INDEX IF NOT EXISTS idx_team_level ON team_tree(level)`
    await sql`CREATE INDEX IF NOT EXISTS idx_team_root ON team_tree(LOWER(root_wallet))`
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_team_wallet_unique ON team_tree(LOWER(wallet_address))`

    // 4. 创建 assigned_records 表
    await sql`
      CREATE TABLE IF NOT EXISTS assigned_records (
        id SERIAL PRIMARY KEY,
        node_id VARCHAR(50) NOT NULL,
        wallet_address VARCHAR(42) NOT NULL,
        total_income DECIMAL(20, 8) DEFAULT 0,
        daily_income DECIMAL(20, 8) DEFAULT 0,
        last_reward_date DATE,
        reward_type VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log('✅ assigned_records 表创建成功')

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_assigned_node ON assigned_records(node_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_assigned_wallet ON assigned_records(LOWER(wallet_address))`
    await sql`CREATE INDEX IF NOT EXISTS idx_assigned_date ON assigned_records(last_reward_date DESC)`

    // 5. 扩展 wallets 表字段
    console.log('开始扩展 wallets 表...')
    
    try {
      // ashva_balance
      await sql`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='wallets' AND column_name='ashva_balance') THEN
            ALTER TABLE wallets ADD COLUMN ashva_balance DECIMAL(20, 8) DEFAULT 0;
          END IF;
        END $$
      `
      
      // member_level
      await sql`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='wallets' AND column_name='member_level') THEN
            ALTER TABLE wallets ADD COLUMN member_level VARCHAR(20) DEFAULT 'normal';
          END IF;
        END $$
      `
      
      // parent_wallet
      await sql`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='wallets' AND column_name='parent_wallet') THEN
            ALTER TABLE wallets ADD COLUMN parent_wallet VARCHAR(42);
          END IF;
        END $$
      `
      
      // total_earnings
      await sql`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='wallets' AND column_name='total_earnings') THEN
            ALTER TABLE wallets ADD COLUMN total_earnings DECIMAL(20, 8) DEFAULT 0;
          END IF;
        END $$
      `
      
      console.log('✅ wallets 表字段扩展成功')
    } catch (error) {
      console.log('⚠️ wallets 表部分字段可能已存在')
    }

    // 6. 扩展 orders 表字段 (映射为nodes)
    console.log('开始扩展 orders 表...')
    
    try {
      // node_id
      await sql`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='orders' AND column_name='node_id') THEN
            ALTER TABLE orders ADD COLUMN node_id VARCHAR(50);
          END IF;
        END $$
      `
      
      // total_earnings
      await sql`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='orders' AND column_name='total_earnings') THEN
            ALTER TABLE orders ADD COLUMN total_earnings DECIMAL(20, 8) DEFAULT 0;
          END IF;
        END $$
      `
      
      // cpu_cores, memory_gb, storage_gb
      await sql`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='orders' AND column_name='cpu_cores') THEN
            ALTER TABLE orders ADD COLUMN cpu_cores INTEGER DEFAULT 0;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='orders' AND column_name='memory_gb') THEN
            ALTER TABLE orders ADD COLUMN memory_gb DECIMAL(10, 2) DEFAULT 0;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='orders' AND column_name='storage_gb') THEN
            ALTER TABLE orders ADD COLUMN storage_gb DECIMAL(10, 2) DEFAULT 0;
          END IF;
        END $$
      `
      
      // uptime_percentage, is_transferable
      await sql`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='orders' AND column_name='uptime_percentage') THEN
            ALTER TABLE orders ADD COLUMN uptime_percentage DECIMAL(5, 2) DEFAULT 0;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='orders' AND column_name='is_transferable') THEN
            ALTER TABLE orders ADD COLUMN is_transferable BOOLEAN DEFAULT true;
          END IF;
        END $$
      `
      
      console.log('✅ orders 表字段扩展成功')
    } catch (error) {
      console.log('⚠️ orders 表部分字段可能已存在')
    }

    // 7. 初始化 team_tree 数据
    console.log('初始化 team_tree 数据...')
    
    await sql`
      INSERT INTO team_tree (wallet_address, parent_wallet, level, path, root_wallet)
      SELECT 
        wallet_address,
        parent_wallet,
        CASE WHEN parent_wallet IS NULL THEN 0 ELSE 1 END as level,
        CASE 
          WHEN parent_wallet IS NULL THEN wallet_address
          ELSE parent_wallet || '/' || wallet_address
        END as path,
        COALESCE(parent_wallet, wallet_address) as root_wallet
      FROM wallets
      WHERE parent_wallet IS NOT NULL
      ON CONFLICT DO NOTHING
    `
    
    console.log('✅ team_tree 数据初始化完成')

    // 8. 查询统计
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM commission_records) as commission_count,
        (SELECT COUNT(*) FROM withdrawal_records) as withdrawal_count,
        (SELECT COUNT(*) FROM team_tree) as team_tree_count,
        (SELECT COUNT(*) FROM assigned_records) as assigned_count,
        (SELECT COUNT(*) FROM wallets) as wallets_count,
        (SELECT COUNT(*) FROM orders) as orders_count
    `

    return NextResponse.json({
      success: true,
      message: '数据库迁移完成!',
      statistics: stats.rows[0],
      tables_created: [
        'commission_records',
        'withdrawal_records',
        'team_tree',
        'assigned_records'
      ],
      tables_extended: [
        'wallets (ashva_balance, member_level, parent_wallet, total_earnings)',
        'orders (node_id, total_earnings, cpu_cores, memory_gb, storage_gb, uptime_percentage, is_transferable)'
      ]
    })

  } catch (error: any) {
    console.error('数据库迁移失败:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}
