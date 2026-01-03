import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  try {
    // 1. 创建products表
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        node_type VARCHAR(20) NOT NULL,
        order_type VARCHAR(20) NOT NULL,
        base_price DECIMAL(20, 8) DEFAULT 0,
        staking_required DECIMAL(20, 8) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        features JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // 2. 插入云节点托管
    await sql`
      INSERT INTO products (product_id, name, description, node_type, order_type, base_price, staking_required, features)
      VALUES (
        'cloud-hosting',
        '云节点托管',
        '高性能云服务器托管服务,提供24/7稳定运行的区块链节点',
        'cloud',
        'hosting',
        100.00,
        50.00,
        '["24/7运行", "高性能CPU", "灵活配置", "自动备份", "实时监控"]'::jsonb
      )
      ON CONFLICT (product_id) DO NOTHING
    `

    // 3. 插入镜像节点  
    await sql`
      INSERT INTO products (product_id, name, description, node_type, order_type, base_price, staking_required, features)
      VALUES (
        'image-node',
        '镜像节点',
        '区块链数据镜像存储节点,提供高可用的分布式存储服务',
        'image',
        'image',
        200.00,
        100.00,
        '["数据镜像", "分布式存储", "高可用性", "自动同步", "安全加密"]'::jsonb
      )
      ON CONFLICT (product_id) DO NOTHING
    `

    // 4. 查询结果
    const result = await sql`SELECT * FROM products ORDER BY id`
    
    const products = result.rows || []

    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
      products_count: products.length,
      products: products
    })
  } catch (error: any) {
    console.error('初始化错误:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || '初始化失败'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const result = await sql`SELECT * FROM products ORDER BY id`
    const products = result.rows || []
    
    return NextResponse.json({
      success: true,
      products_count: products.length,
      products: products
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || '查询失败'
    }, { status: 500 })
  }
}
