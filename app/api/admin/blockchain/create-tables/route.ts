import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS bl_admins (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, email VARCHAR(255), role VARCHAR(50) DEFAULT 'admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS bl_customers (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, phone VARCHAR(20), email VARCHAR(255), wallet_address VARCHAR(42), status VARCHAR(20) DEFAULT 'active', total_machines INTEGER DEFAULT 0, total_earnings DECIMAL(20, 8) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS bl_machines (id SERIAL PRIMARY KEY, customer_id INTEGER, activation_code VARCHAR(100) UNIQUE NOT NULL, status VARCHAR(20) DEFAULT 'pending', hardware_info TEXT, network_config TEXT, last_heartbeat TIMESTAMP, activated_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS bl_blockchain_nodes (id SERIAL PRIMARY KEY, machine_id INTEGER, node_type VARCHAR(50) NOT NULL, status VARCHAR(20) DEFAULT 'deploying', config TEXT, port INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS bl_earnings (id SERIAL PRIMARY KEY, machine_id INTEGER, node_id INTEGER, amount DECIMAL(20, 8) NOT NULL, currency VARCHAR(10) DEFAULT 'USDT', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    return NextResponse.json({success: true, message: '区块链托管系统 - 5个表已创建', tables: ['bl_admins', 'bl_customers', 'bl_machines', 'bl_blockchain_nodes', 'bl_earnings']});
  } catch (error: any) {
    return NextResponse.json({success: false, error: error.message}, { status: 500 });
  }
}
