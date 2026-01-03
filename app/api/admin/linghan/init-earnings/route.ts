import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    // 创建灵瀚云设备每日收益表
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
    
    await sql`CREATE INDEX IF NOT EXISTS idx_linghan_earnings_device_date ON linghan_device_daily_earnings(device_id, income_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linghan_earnings_date ON linghan_device_daily_earnings(income_date DESC)`;
    
    console.log('✅ 灵瀚云收益表创建成功');
    
    return NextResponse.json({
      success: true,
      message: '数据库表创建成功',
      tables: ['linghan_device_daily_earnings']
    });
  } catch (error) {
    console.error('创建表失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
