// app/api/admin/linghan/init/route.ts
// 灵瀚云数据库表初始化API

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    // 1. 灵瀚云设备详情表
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_devices (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) UNIQUE NOT NULL,
        device_name VARCHAR(200),
        node_id INT REFERENCES blockchain_nodes(id) ON DELETE CASCADE,
        
        province VARCHAR(50),
        city VARCHAR(50),
        isp VARCHAR(50),
        
        up_bandwidth INT DEFAULT 0,
        line_number INT DEFAULT 1,
        dev_type INT DEFAULT 2,
        
        status INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_sync_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_linghan_device_id ON linghan_devices(device_id);
      CREATE INDEX IF NOT EXISTS idx_linghan_node_id ON linghan_devices(node_id);
      CREATE INDEX IF NOT EXISTS idx_linghan_status ON linghan_devices(status);
    `;

    // 2. 灵瀚云流量历史表
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_traffic_history (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        
        record_date DATE NOT NULL,
        record_hour INT,
        total_traffic DECIMAL(15,2) DEFAULT 0,
        in_traffic DECIMAL(15,2) DEFAULT 0,
        out_traffic DECIMAL(15,2) DEFAULT 0,
        
        avg_up_speed DECIMAL(10,2),
        avg_down_speed DECIMAL(10,2),
        peak_up_speed DECIMAL(10,2),
        peak_down_speed DECIMAL(10,2),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(device_id, record_date, record_hour)
      );
      
      CREATE INDEX IF NOT EXISTS idx_traffic_device_date ON linghan_traffic_history(device_id, record_date);
      CREATE INDEX IF NOT EXISTS idx_traffic_date ON linghan_traffic_history(record_date);
    `;

    // 3. 灵瀚云收益历史表
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_income_history (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        
        income_date DATE NOT NULL,
        total_income DECIMAL(10,2) DEFAULT 0,
        fine DECIMAL(10,2) DEFAULT 0,
        fine_reason TEXT,
        
        flow DECIMAL(15,2) DEFAULT 0,
        bandwidth_95 DECIMAL(10,2),
        
        status INT DEFAULT 0,
        settlement_date TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(device_id, income_date)
      );
      
      CREATE INDEX IF NOT EXISTS idx_income_device_date ON linghan_income_history(device_id, income_date);
      CREATE INDEX IF NOT EXISTS idx_income_date ON linghan_income_history(income_date);
      CREATE INDEX IF NOT EXISTS idx_income_status ON linghan_income_history(status);
    `;

    // 4. 灵瀚云网卡信息表
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_network_cards (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        
        card_name VARCHAR(100) NOT NULL,
        card_type VARCHAR(50),
        mac_address VARCHAR(50),
        
        ip_address VARCHAR(50),
        gateway VARCHAR(50),
        subnet_mask VARCHAR(50),
        dns_servers TEXT,
        
        speed VARCHAR(50),
        status VARCHAR(50) DEFAULT 'inactive',
        is_active BOOLEAN DEFAULT TRUE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_card_device ON linghan_network_cards(device_id, card_name);
      CREATE INDEX IF NOT EXISTS idx_card_device_id ON linghan_network_cards(device_id);
    `;

    // 5. 灵瀚云拨号信息表
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_dialing_info (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        card_name VARCHAR(100) NOT NULL,
        
        line_count INT DEFAULT 0,
        have_dial_count INT DEFAULT 0,
        not_dial_count INT DEFAULT 0,
        connect_count INT DEFAULT 0,
        
        speed DECIMAL(10,2) DEFAULT 0,
        line_list JSONB,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(device_id, card_name)
      );
      
      CREATE INDEX IF NOT EXISTS idx_dialing_device ON linghan_dialing_info(device_id);
    `;

    // 6. 灵瀚云同步日志表
    await sql`
      CREATE TABLE IF NOT EXISTS linghan_sync_logs (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100),
        
        sync_type VARCHAR(50) NOT NULL,
        sync_status VARCHAR(50) NOT NULL,
        
        records_synced INT DEFAULT 0,
        records_failed INT DEFAULT 0,
        
        error_message TEXT,
        api_response JSONB,
        
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        duration_seconds INT
      );
      
      CREATE INDEX IF NOT EXISTS idx_sync_type ON linghan_sync_logs(sync_type);
      CREATE INDEX IF NOT EXISTS idx_sync_status ON linghan_sync_logs(sync_status);
      CREATE INDEX IF NOT EXISTS idx_sync_device ON linghan_sync_logs(device_id);
    `;

    return NextResponse.json({
      success: true,
      message: '灵瀚云数据表初始化成功',
      tables: [
        'linghan_devices',
        'linghan_traffic_history',
        'linghan_income_history',
        'linghan_network_cards',
        'linghan_dialing_info',
        'linghan_sync_logs'
      ]
    });

  } catch (error: any) {
    console.error('初始化失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
