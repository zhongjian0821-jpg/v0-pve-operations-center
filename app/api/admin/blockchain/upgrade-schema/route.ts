import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    console.log('🔄 开始升级数据库结构...');
    
    // ========================================
    // 1. 升级 bl_machines 表
    // ========================================
    console.log('📊 升级 bl_machines 表...');
    await sql`
      ALTER TABLE bl_machines 
      ADD COLUMN IF NOT EXISTS node_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS machine_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50),
      ADD COLUMN IF NOT EXISTS gateway VARCHAR(50),
      ADD COLUMN IF NOT EXISTS subnet_mask VARCHAR(50),
      ADD COLUMN IF NOT EXISTS ssh_port INTEGER DEFAULT 22,
      ADD COLUMN IF NOT EXISTS ssh_user VARCHAR(50) DEFAULT 'root',
      ADD COLUMN IF NOT EXISTS ssh_password VARCHAR(255),
      ADD COLUMN IF NOT EXISTS cpu_cores INTEGER,
      ADD COLUMN IF NOT EXISTS memory_gb INTEGER,
      ADD COLUMN IF NOT EXISTS storage_gb INTEGER
    `;
    console.log('✅ bl_machines 表升级完成');
    
    // ========================================
    // 2. 升级 bl_blockchain_nodes 表
    // ========================================
    console.log('📊 升级 bl_blockchain_nodes 表...');
    await sql`
      ALTER TABLE bl_blockchain_nodes
      ADD COLUMN IF NOT EXISTS node_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS task_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS container_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS container_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(100),
      ADD COLUMN IF NOT EXISTS daily_earnings DECIMAL(20,8) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS hourly_earnings DECIMAL(20,8) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(20,8) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS uptime_hours INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS deployed_by VARCHAR(100),
      ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMP
    `;
    console.log('✅ bl_blockchain_nodes 表升级完成');
    
    // ========================================
    // 3. 创建任务收益统计表
    // ========================================
    console.log('📊 创建 task_hourly_earnings 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS task_hourly_earnings (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        node_id VARCHAR(100) NOT NULL,
        machine_id INTEGER NOT NULL,
        wallet_address VARCHAR(42) NOT NULL,
        hour_start TIMESTAMP NOT NULL,
        earnings_amount DECIMAL(20, 8) DEFAULT 0,
        earnings_currency VARCHAR(10) DEFAULT 'USD',
        uptime_minutes INTEGER DEFAULT 0,
        cpu_usage DECIMAL(5,2),
        memory_usage DECIMAL(5,2),
        network_io_gb DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ task_hourly_earnings 表创建完成');
    
    // ========================================
    // 4. 创建索引
    // ========================================
    console.log('📊 创建索引...');
    await sql`CREATE INDEX IF NOT EXISTS idx_task_earnings_hour ON task_hourly_earnings(hour_start)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_earnings_node ON task_hourly_earnings(node_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_earnings_wallet ON task_hourly_earnings(wallet_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_earnings_task ON task_hourly_earnings(task_id)`;
    console.log('✅ 索引创建完成');
    
    // ========================================
    // 5. 验证表结构
    // ========================================
    console.log('🔍 验证表结构...');
    
    const machinesColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bl_machines'
    `;
    
    const nodesColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bl_blockchain_nodes'
    `;
    
    const earningsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'task_hourly_earnings'
      )
    `;
    
    console.log('✅ 数据库升级全部完成！');
    
    return NextResponse.json({
      success: true,
      message: '数据库结构升级成功',
      details: {
        bl_machines_columns: machinesColumns.length,
        bl_blockchain_nodes_columns: nodesColumns.length,
        task_hourly_earnings_created: earningsExists[0].exists,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ 数据库升级失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 查询当前表结构
    const machinesColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bl_machines'
      ORDER BY ordinal_position
    `;
    
    const nodesColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bl_blockchain_nodes'
      ORDER BY ordinal_position
    `;
    
    const earningsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'task_hourly_earnings'
      ORDER BY ordinal_position
    `;
    
    return NextResponse.json({
      success: true,
      tables: {
        bl_machines: machinesColumns,
        bl_blockchain_nodes: nodesColumns,
        task_hourly_earnings: earningsColumns
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
