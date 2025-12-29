// app/api/admin/migrate-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 开始执行P0数据库迁移...');
    
    const results = {
      success: [],
      errors: [],
      warnings: []
    };

    // 任务1: 修改wallets表
    try {
      await query(`
        ALTER TABLE wallets 
          ALTER COLUMN ashva_balance TYPE NUMERIC(20,8),
          ALTER COLUMN total_earnings TYPE NUMERIC(20,8),
          ALTER COLUMN commission_rate_level1 TYPE NUMERIC(5,4),
          ALTER COLUMN commission_rate_level2 TYPE NUMERIC(5,4)
      `, []);
      results.success.push('✅ wallets表字段精度修改成功');
    } catch (e: any) {
      if (e.message.includes('already')) {
        results.warnings.push('⚠️  wallets表字段已是正确类型');
      } else {
        results.errors.push(`❌ wallets表修改失败: ${e.message}`);
      }
    }

    // 添加新字段
    const walletColumns = [
      'distributable_commission NUMERIC(20,8) DEFAULT 0',
      'distributed_commission NUMERIC(20,8) DEFAULT 0',
      'self_commission_rate NUMERIC(5,4) DEFAULT 0',
      'pending_withdrawal NUMERIC(20,8) DEFAULT 0',
      'total_withdrawn NUMERIC(20,8) DEFAULT 0'
    ];

    for (const col of walletColumns) {
      try {
        const colName = col.split(' ')[0];
        await query(`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS ${col}`, []);
        results.success.push(`✅ wallets.${colName}添加成功`);
      } catch (e: any) {
        results.warnings.push(`⚠️  wallets.${col.split(' ')[0]}可能已存在`);
      }
    }

    // 任务2: 修改nodes表
    const nodeColumns = [
      'purchase_price NUMERIC(20,8)',
      'staking_amount NUMERIC(20,8)',
      'staking_required_usd NUMERIC(20,2)',
      'staking_status VARCHAR(20)',
      'cpu_usage_percentage NUMERIC(5,2)',
      'memory_usage_percentage NUMERIC(5,2)',
      'storage_used_percentage NUMERIC(5,2)',
      'uptime_percentage NUMERIC(5,2) DEFAULT 99.9',
      'data_transferred_gb NUMERIC(20,4) DEFAULT 0',
      'is_transferable BOOLEAN DEFAULT true',
      'tx_hash VARCHAR(66)',
      'install_command TEXT'
    ];

    for (const col of nodeColumns) {
      try {
        const colName = col.split(' ')[0];
        await query(`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS ${col}`, []);
        results.success.push(`✅ nodes.${colName}添加成功`);
      } catch (e: any) {
        results.warnings.push(`⚠️  nodes.${col.split(' ')[0]}可能已存在`);
      }
    }

    // 任务3: 创建hierarchy表
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS hierarchy (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(100) NOT NULL,
          parent_wallet VARCHAR(100) NOT NULL,
          level INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uk_hierarchy_wallet_parent_level UNIQUE(wallet_address, parent_wallet, level)
        )
      `, []);
      results.success.push('✅ hierarchy表创建成功');

      await query(`CREATE INDEX IF NOT EXISTS idx_hierarchy_wallet ON hierarchy(wallet_address)`, []);
      await query(`CREATE INDEX IF NOT EXISTS idx_hierarchy_parent ON hierarchy(parent_wallet)`, []);
      await query(`CREATE INDEX IF NOT EXISTS idx_hierarchy_level ON hierarchy(level)`, []);
      results.success.push('✅ hierarchy表索引创建成功');
    } catch (e: any) {
      results.warnings.push('⚠️  hierarchy表可能已存在');
    }

    // 任务4: 创建commission_distribution表
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS commission_distribution (
          id SERIAL PRIMARY KEY,
          from_wallet VARCHAR(100) NOT NULL,
          to_wallet VARCHAR(100) NOT NULL,
          level INTEGER NOT NULL,
          percentage NUMERIC(5,4) NOT NULL,
          rate NUMERIC(5,4) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uk_commission_dist_from_to_level UNIQUE(from_wallet, to_wallet, level)
        )
      `, []);
      results.success.push('✅ commission_distribution表创建成功');

      await query(`CREATE INDEX IF NOT EXISTS idx_commission_dist_from ON commission_distribution(from_wallet)`, []);
      await query(`CREATE INDEX IF NOT EXISTS idx_commission_dist_to ON commission_distribution(to_wallet)`, []);
      results.success.push('✅ commission_distribution表索引创建成功');
    } catch (e: any) {
      results.warnings.push('⚠️  commission_distribution表可能已存在');
    }

    // 任务5: 创建member_level_config表
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS member_level_config (
          id SERIAL PRIMARY KEY,
          level_name VARCHAR(50) UNIQUE NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          max_depth INTEGER NOT NULL,
          commission_total_percentage NUMERIC(5,4) NOT NULL,
          description TEXT,
          min_ashva_value_usd NUMERIC(20,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, []);
      results.success.push('✅ member_level_config表创建成功');

      await query(`CREATE INDEX IF NOT EXISTS idx_member_level_name ON member_level_config(level_name)`, []);
      results.success.push('✅ member_level_config表索引创建成功');

      // 插入默认等级配置
      await query(`
        INSERT INTO member_level_config 
          (level_name, display_name, max_depth, commission_total_percentage, min_ashva_value_usd, description) 
        VALUES
          ($1, $2, $3, $4, $5, $6),
          ($7, $8, $9, $10, $11, $12),
          ($13, $14, $15, $16, $17, $18)
        ON CONFLICT (level_name) DO NOTHING
      `, [
        'normal', '普通会员', 0, 0.0000, 0, '默认等级，无推荐佣金',
        'market_partner', '市场合伙人', 2, 0.1500, 3000, 'ASHVA价值≥$3,000，享受15%两级推荐佣金',
        'global_partner', '全球合伙人', 10, 0.2000, 10000, 'ASHVA价值≥$10,000，享受20%十级推荐佣金'
      ]);
      results.success.push('✅ 默认会员等级配置插入成功');
    } catch (e: any) {
      results.warnings.push('⚠️  member_level_config表可能已存在');
    }

    // 验证迁移结果
    const verification = await query(`
      SELECT 'wallets' as table_name, COUNT(*) as field_count
      FROM information_schema.columns 
      WHERE table_name = 'wallets' 
        AND column_name IN ('distributable_commission', 'distributed_commission', 
                            'self_commission_rate', 'pending_withdrawal', 'total_withdrawn')
      UNION ALL
      SELECT 'nodes' as table_name, COUNT(*) as field_count
      FROM information_schema.columns 
      WHERE table_name = 'nodes' 
        AND column_name IN ('purchase_price', 'staking_amount', 'is_transferable', 
                            'tx_hash', 'cpu_usage_percentage')
      UNION ALL
      SELECT table_name, 1 as field_count
      FROM information_schema.tables 
      WHERE table_name IN ('hierarchy', 'commission_distribution', 'member_level_config')
    `, []);

    console.log('📊 迁移完成！');
    console.log('成功:', results.success.length);
    console.log('警告:', results.warnings.length);
    console.log('错误:', results.errors.length);

    return NextResponse.json({
      success: results.errors.length === 0,
      message: 'P0数据库迁移执行完成',
      results: {
        success: results.success,
        warnings: results.warnings,
        errors: results.errors
      },
      verification: verification,
      summary: {
        total: results.success.length + results.warnings.length + results.errors.length,
        successCount: results.success.length,
        warningCount: results.warnings.length,
        errorCount: results.errors.length
      }
    });

  } catch (error: any) {
    console.error('❌ 迁移失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
