import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 开始修复数据库schema...');
    
    const results = {
      success: [],
      warnings: [],
      errors: []
    };

    // 首先检查nodes表是否存在基础字段
    const checkColumns = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'nodes'
      ORDER BY column_name
    `, []);

    const existingColumns = checkColumns.map(row => row.column_name);
    console.log('现有nodes表字段:', existingColumns);

    // 基础字段（这些应该已存在）
    const baseFields = [
      'node_id VARCHAR(100)',
      'wallet_address VARCHAR(100)',
      'node_type VARCHAR(50)',
      'status VARCHAR(50)',
      'total_earnings NUMERIC(20,8)'
    ];

    // 确保基础字段存在
    for (const field of baseFields) {
      const fieldName = field.split(' ')[0];
      if (!existingColumns.includes(fieldName)) {
        try {
          await query(`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS ${field}`, []);
          results.success.push(`✅ 基础字段 ${fieldName} 添加成功`);
        } catch (e: any) {
          results.warnings.push(`⚠️ 基础字段 ${fieldName}: ${e.message}`);
        }
      }
    }

    // P0迁移字段
    const p0Fields = [
      'cpu_cores INTEGER',
      'memory_gb INTEGER',
      'storage_gb INTEGER',
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
      'install_command TEXT',
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];

    for (const field of p0Fields) {
      const fieldName = field.split(' ')[0];
      if (!existingColumns.includes(fieldName)) {
        try {
          await query(`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS ${field}`, []);
          results.success.push(`✅ P0字段 ${fieldName} 添加成功`);
        } catch (e: any) {
          results.errors.push(`❌ P0字段 ${fieldName}: ${e.message}`);
        }
      } else {
        results.warnings.push(`⚠️ P0字段 ${fieldName} 已存在`);
      }
    }

    // 检查修复后的结果
    const finalCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'nodes'
      ORDER BY column_name
    `, []);

    console.log(`📊 修复完成！nodes表现有 ${finalCheck.length} 个字段`);

    return NextResponse.json({
      success: results.errors.length === 0,
      message: 'Schema修复完成',
      results: {
        success: results.success,
        warnings: results.warnings,
        errors: results.errors
      },
      finalSchema: finalCheck,
      summary: {
        totalFields: finalCheck.length,
        successCount: results.success.length,
        warningCount: results.warnings.length,
        errorCount: results.errors.length
      }
    });

  } catch (error: any) {
    console.error('❌ Schema修复失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
