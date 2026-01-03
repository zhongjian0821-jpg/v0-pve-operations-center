import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  const results: any[] = []
  
  try {
    console.log('🚀 开始数据库迁移...')

    // =================================================================
    // 步骤1: 创建 commission_records 表
    // =================================================================
    try {
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
      results.push({ step: 1, table: 'commission_records', status: 'success' })
    } catch (error: any) {
      results.push({ step: 1, table: 'commission_records', status: 'error', error: error.message })
    }

    // 创建索引
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_commission_wallet ON commission_records(LOWER(wallet_address))`
      await sql`CREATE INDEX IF NOT EXISTS idx_commission_level ON commission_records(commission_level)`
      await sql`CREATE INDEX IF NOT EXISTS idx_commission_from ON commission_records(LOWER(from_wallet))`
    } catch (error: any) {
      console.log('索引创建警告:', error.message)
    }

    // =================================================================
    // 步骤2: 创建 withdrawal_records 表
    // =================================================================
    try {
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
      results.push({ step: 2, table: 'withdrawal_records', status: 'success' })
    } catch (error: any) {
      results.push({ step: 2, table: 'withdrawal_records', status: 'error', error: error.message })
    }

    // 创建索引
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_withdrawal_wallet ON withdrawal_records(LOWER(wallet_address))`
      await sql`CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_records(status)`
    } catch (error: any) {
      console.log('索引创建警告:', error.message)
    }

    // =================================================================
    // 步骤3: 创建 team_tree 表
    // =================================================================
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS team_tree (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL UNIQUE,
          parent_wallet VARCHAR(42),
          level INTEGER DEFAULT 1,
          path TEXT,
          root_wallet VARCHAR(42),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
      results.push({ step: 3, table: 'team_tree', status: 'success' })
    } catch (error: any) {
      results.push({ step: 3, table: 'team_tree', status: 'error', error: error.message })
    }

    // 创建索引
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_team_wallet ON team_tree(LOWER(wallet_address))`
      await sql`CREATE INDEX IF NOT EXISTS idx_team_parent ON team_tree(LOWER(parent_wallet))`
      await sql`CREATE INDEX IF NOT EXISTS idx_team_level ON team_tree(level)`
    } catch (error: any) {
      console.log('索引创建警告:', error.message)
    }

    // =================================================================
    // 步骤4: 扩展 wallets 表
    // =================================================================
    const wallets_fields = [
      { name: 'ashva_balance', type: 'DECIMAL(20, 8) DEFAULT 0' },
      { name: 'member_level', type: "VARCHAR(20) DEFAULT 'normal'" },
      { name: 'parent_wallet', type: 'VARCHAR(42)' },
      { name: 'total_earnings', type: 'DECIMAL(20, 8) DEFAULT 0' },
    ]

    for (const field of wallets_fields) {
      try {
        // 检查字段是否存在
        const check = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'wallets' 
          AND column_name = ${field.name}
        `
        
        if (check.length === 0) {
          // 字段不存在,添加
          await sql.unsafe(`ALTER TABLE wallets ADD COLUMN ${field.name} ${field.type}`)
          results.push({ step: 4, table: 'wallets', field: field.name, status: 'added' })
        } else {
          results.push({ step: 4, table: 'wallets', field: field.name, status: 'exists' })
        }
      } catch (error: any) {
        results.push({ step: 4, table: 'wallets', field: field.name, status: 'error', error: error.message })
      }
    }

    // =================================================================
    // 步骤5: 扩展 nodes 表
    // =================================================================
    const nodes_fields = [
      { name: 'total_earnings', type: 'DECIMAL(20, 8) DEFAULT 0' },
      { name: 'uptime_percentage', type: 'DECIMAL(5, 2) DEFAULT 0' },
      { name: 'data_transferred_gb', type: 'DECIMAL(15, 2) DEFAULT 0' },
      { name: 'cpu_usage_percentage', type: 'DECIMAL(5, 2) DEFAULT 0' },
      { name: 'memory_usage_percentage', type: 'DECIMAL(5, 2) DEFAULT 0' },
      { name: 'storage_used_percentage', type: 'DECIMAL(5, 2) DEFAULT 0' },
    ]

    for (const field of nodes_fields) {
      try {
        const check = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'nodes' 
          AND column_name = ${field.name}
        `
        
        if (check.length === 0) {
          await sql.unsafe(`ALTER TABLE nodes ADD COLUMN ${field.name} ${field.type}`)
          results.push({ step: 5, table: 'nodes', field: field.name, status: 'added' })
        } else {
          results.push({ step: 5, table: 'nodes', field: field.name, status: 'exists' })
        }
      } catch (error: any) {
        results.push({ step: 5, table: 'nodes', field: field.name, status: 'error', error: error.message })
      }
    }

    // =================================================================
    // 步骤6: 初始化 team_tree 数据
    // =================================================================
    try {
      // 先检查wallets表是否有parent_wallet字段
      const has_parent = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'wallets' 
        AND column_name = 'parent_wallet'
      `
      
      if (has_parent.length > 0) {
        await sql`
          INSERT INTO team_tree (wallet_address, parent_wallet, level, path, root_wallet)
          SELECT 
            wallet_address,
            parent_wallet,
            1 as level,
            COALESCE(parent_wallet, '') || '/' || wallet_address as path,
            COALESCE(parent_wallet, wallet_address) as root_wallet
          FROM wallets
          WHERE parent_wallet IS NOT NULL
          ON CONFLICT (wallet_address) DO NOTHING
        `
        results.push({ step: 6, action: 'init_team_tree', status: 'success' })
      } else {
        results.push({ step: 6, action: 'init_team_tree', status: 'skipped', reason: 'parent_wallet字段不存在' })
      }
    } catch (error: any) {
      results.push({ step: 6, action: 'init_team_tree', status: 'error', error: error.message })
    }

    // =================================================================
    // 步骤7: 统计信息
    // =================================================================
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM commission_records) as commission_count,
        (SELECT COUNT(*) FROM withdrawal_records) as withdrawal_count,
        (SELECT COUNT(*) FROM team_tree) as team_tree_count,
        (SELECT COUNT(*) FROM wallets) as wallets_count,
        (SELECT COUNT(*) FROM nodes) as nodes_count
    `

    return NextResponse.json({
      success: true,
      message: '数据库迁移完成!',
      results: results,
      statistics: stats[0],
      summary: {
        tables_created: results.filter(r => r.status === 'success').length,
        fields_added: results.filter(r => r.status === 'added').length,
        errors: results.filter(r => r.status === 'error').length,
      }
    })

  } catch (error: any) {
    console.error('数据库迁移失败:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      results: results
    }, { status: 500 })
  }
}
