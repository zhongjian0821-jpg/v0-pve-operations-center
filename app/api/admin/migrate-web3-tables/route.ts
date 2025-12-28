import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS cloud_node_purchases (id SERIAL PRIMARY KEY, wallet_address VARCHAR(42) NOT NULL, node_type VARCHAR(50) NOT NULL, quantity INTEGER DEFAULT 1, price_per_node DECIMAL(20, 8), total_price DECIMAL(20, 8), transaction_hash VARCHAR(66), status VARCHAR(20) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS image_node_purchases (id SERIAL PRIMARY KEY, wallet_address VARCHAR(42) NOT NULL, image_type VARCHAR(50) NOT NULL, device_id VARCHAR(100), price DECIMAL(20, 8), transaction_hash VARCHAR(66), status VARCHAR(20) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS marketplace_listings (id SERIAL PRIMARY KEY, seller_address VARCHAR(42) NOT NULL, node_id INTEGER, listing_price DECIMAL(20, 8) NOT NULL, currency VARCHAR(10) DEFAULT 'ASHVA', status VARCHAR(20) DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS marketplace_transactions (id SERIAL PRIMARY KEY, listing_id INTEGER, buyer_address VARCHAR(42) NOT NULL, seller_address VARCHAR(42) NOT NULL, node_id INTEGER, price DECIMAL(20, 8) NOT NULL, transaction_hash VARCHAR(66), status VARCHAR(20) DEFAULT 'completed', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS ashva_price_history (id SERIAL PRIMARY KEY, price_usd DECIMAL(20, 8) NOT NULL, price_cny DECIMAL(20, 8), volume_24h DECIMAL(30, 8), market_cap DECIMAL(30, 8), timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS system_logs (id SERIAL PRIMARY KEY, event_type VARCHAR(50) NOT NULL, event_category VARCHAR(50), user_address VARCHAR(42), ip_address VARCHAR(45), user_agent TEXT, request_data TEXT, response_status INTEGER, error_message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, wallet_address VARCHAR(42) UNIQUE NOT NULL, username VARCHAR(100), email VARCHAR(255), phone VARCHAR(20), avatar_url TEXT, bio TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    return NextResponse.json({success: true, message: '所有7个表已成功创建', tables: ['cloud_node_purchases', 'image_node_purchases', 'marketplace_listings', 'marketplace_transactions', 'ashva_price_history', 'system_logs', 'users']});
  } catch (error: any) {
    return NextResponse.json({success: false, error: error.message}, { status: 500 });
  }
}
