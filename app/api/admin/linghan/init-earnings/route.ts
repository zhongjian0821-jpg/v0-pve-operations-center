import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    console.log('[Init DB] 🚀 开始初始化数据库...');
    
    // 创建表
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_device_daily_earnings (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        device_name VARCHAR(200),
        income_date DATE NOT NULL,
        total_income DECIMAL(10, 2) DEFAULT 0,
        flow DECIMAL(10, 2) DEFAULT 0,
        fine DECIMAL(10, 2) DEFAULT 0,
        fine_reason TEXT,
        status INTEGER DEFAULT 0,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(device_id, income_date)
      )
    `;
    
    console.log('[Init DB] ✅ 表创建成功');
    
    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_linghan_earnings_device_date ON linghan_device_daily_earnings(device_id, income_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linghan_earnings_date ON linghan_device_daily_earnings(income_date DESC)`;
    
    console.log('[Init DB] ✅ 索引创建成功');
    
    // 验证表是否存在
    const checkResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'linghan_device_daily_earnings'
      )
    `;
    
    const tableExists = checkResult[0]?.exists;
    
    if (tableExists) {
      console.log('[Init DB] ✅ 表存在验证成功');
      
      return NextResponse.json({
        success: true,
        message: '✅ 数据库表创建成功！',
        table_name: 'linghan_device_daily_earnings',
        table_exists: true
      });
    } else {
      console.error('[Init DB] ❌ 表不存在');
      return NextResponse.json({
        success: false,
        error: '表创建后验证失败'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[Init DB] ❌ 初始化失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// 也支持GET请求
 export async function GET() {
  return POST();
}
