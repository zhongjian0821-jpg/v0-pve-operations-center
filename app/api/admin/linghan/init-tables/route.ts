// app/api/admin/linghan/init-tables/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    // 创建灵瀚云设备表
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_devices (
        id SERIAL PRIMARY KEY,
        node_id INTEGER REFERENCES bl_blockchain_nodes(id) ON DELETE CASCADE,
        device_id VARCHAR(64) UNIQUE NOT NULL,
        device_name VARCHAR(255),
        province VARCHAR(50),
        city VARCHAR(50),
        isp VARCHAR(50),
        bandwidth_mbps INTEGER,
        online_status VARCHAR(20) DEFAULT 'unknown',
        last_sync_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 创建流量历史表
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_traffic_history (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(64) NOT NULL,
        record_date DATE NOT NULL,
        record_hour INTEGER NOT NULL,
        traffic_mb NUMERIC(15,2),
        upload_speed_mbps NUMERIC(10,2),
        download_speed_mbps NUMERIC(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(device_id, record_date, record_hour)
      )
    `;

    // 创建收益历史表
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_income_history (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(64) NOT NULL,
        income_date DATE NOT NULL,
        total_income_cny NUMERIC(10,2),
        fine_cny NUMERIC(10,2),
        flow_gb NUMERIC(10,2),
        bandwidth_95_mbps NUMERIC(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(device_id, income_date)
      )
    `;

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_linghan_devices_device_id ON linghan_devices(device_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linghan_devices_node_id ON linghan_devices(node_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linghan_traffic_device_date ON linghan_traffic_history(device_id, record_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_linghan_income_device_date ON linghan_income_history(device_id, income_date)`;

    return NextResponse.json({
      success: true,
      message: '灵瀚云数据表初始化成功'
    });
  } catch (error: any) {
    console.error('初始化失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
