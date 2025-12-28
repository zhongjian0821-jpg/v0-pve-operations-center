import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    // 1. 云节点购买记录
    await sql`
      CREATE TABLE IF NOT EXISTS cloud_node_purchases (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        node_type VARCHAR(50) NOT NULL,
        quantity INTEGER DEFAULT 1,
        price_per_node DECIMAL(20, 8),
        total_amount DECIMAL(20, 8),
        payment_method VARCHAR(50),
        payment_token VARCHAR(10),
        status VARCHAR(20) DEFAULT 'pending',
        tx_hash VARCHAR(66),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 2. 镜像节点购买记录
    await sql`
      CREATE TABLE IF NOT EXISTS image_node_purchases (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        image_type VARCHAR(50) NOT NULL,
        device_id VARCHAR(100),
        price DECIMAL(20, 8),
        payment_method VARCHAR(50),
        payment_token VARCHAR(10),
        status VARCHAR(20) DEFAULT 'pending',
        activation_date TIMESTAMP,
        expiry_date TIMESTAMP,
        tx_hash VARCHAR(66),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 3. 节点市场挂单
    await sql`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id SERIAL PRIMARY KEY,
        seller_address VARCHAR(42) NOT NULL,
        node_id INTEGER,
        listing_price DECIMAL(20, 8) NOT NULL,
        currency VARCHAR(10) DEFAULT 'ASHVA',
        status VARCHAR(20) DEFAULT 'active',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        sold_at TIMESTAMP
      )
    `;

    // 4. 节点市场交易记录
    await sql`
      CREATE TABLE IF NOT EXISTS marketplace_transactions (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER,
        buyer_address VARCHAR(42) NOT NULL,
        seller_address VARCHAR(42) NOT NULL,
        node_id INTEGER,
        transaction_price DECIMAL(20, 8) NOT NULL,
        platform_fee DECIMAL(20, 8),
        seller_receives DECIMAL(20, 8),
        tx_hash VARCHAR(66),
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 5. ASHVA 价格历史
    await sql`
      CREATE TABLE IF NOT EXISTS ashva_price_history (
        id SERIAL PRIMARY KEY,
        price_usd DECIMAL(20, 8) NOT NULL,
        price_cny DECIMAL(20, 8),
        volume_24h DECIMAL(30, 8),
        market_cap DECIMAL(30, 8),
        source VARCHAR(50),
        dex_name VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 6. 系统日志
    await sql`
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        event_category VARCHAR(50),
        user_address VARCHAR(42),
        ip_address VARCHAR(45),
        description TEXT,
        metadata JSONB,
        severity VARCHAR(20) DEFAULT 'info',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 7. 用户信息
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        username VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(20),
        avatar_url TEXT,
        bio TEXT,
        status VARCHAR(20) DEFAULT 'active',
        is_verified BOOLEAN DEFAULT false,
        referral_code VARCHAR(20) UNIQUE,
        referred_by VARCHAR(42),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP
      )
    `;

    return successResponse({
      message: 'All 7 new tables created successfully',
      tables: [
        'cloud_node_purchases',
        'image_node_purchases',
        'marketplace_listings',
        'marketplace_transactions',
        'ashva_price_history',
        'system_logs',
        'users'
      ]
    });

  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// 检查表是否存在
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const tables = [
      'cloud_node_purchases',
      'image_node_purchases',
      'marketplace_listings',
      'marketplace_transactions',
      'ashva_price_history',
      'system_logs',
      'users'
    ];

    const results: any = {};

    for (const table of tables) {
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${table}
          )
        `;
        results[table] = result[0].exists;
      } catch (error) {
        results[table] = false;
      }
    }

    return successResponse(results);

  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
