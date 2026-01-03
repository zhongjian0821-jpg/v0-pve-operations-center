import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  try {
    console.log('🔧 开始初始化products表...')

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
        features JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log('✅ products表创建成功')

    // 2. 创建索引
    await sql`
      CREATE INDEX IF NOT EXISTS idx_products_node_type ON products(node_type)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id)
    `
    console.log('✅ 索引创建成功')

    // 3. 插入初始产品数据
    await sql`
      INSERT INTO products (
        product_id, 
        name, 
        description, 
        node_type, 
        order_type, 
        base_price, 
        staking_required, 
        is_active, 
        features
      ) VALUES 
      (
        'cloud-hosting',
        '云节点托管',
        '高性能云服务器托管服务,提供24/7稳定运行的区块链节点',
        'cloud',
        'hosting',
        100.00,
        50.00,
        true,
        '["24/7运行", "高性能CPU", "灵活配置", "自动备份", "实时监控"]'::jsonb
      ),
      (
        'image-node',
        '镜像节点',
        '区块链数据镜像存储节点,提供高可用的分布式存储服务',
        'image',
        'image',
        200.00,
        100.00,
        true,
        '["数据镜像", "分布式存储", "高可用性", "自动同步", "安全加密"]'::jsonb
      )
      ON CONFLICT (product_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        staking_required = EXCLUDED.staking_required,
        features = EXCLUDED.features,
        updated_at = NOW()
    `
    console.log('✅ 初始产品数据插入成功')

    // 4. 查询插入的数据
    const result = await sql`
      SELECT * FROM products ORDER BY id
    `

    return NextResponse.json({
      success: true,
      message: 'products表初始化成功',
      data: {
        table_created: true,
        indexes_created: true,
        products_count: result.rows.length,
        products: result.rows
      }
    })
  } catch (error: any) {
    console.error('❌ 初始化失败:', error)
    return NextResponse.json({
      success: false,
      error: error.message || '初始化失败'
    }, { status: 500 })
  }
}

// GET - 检查表是否存在
export async function GET() {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      ) as table_exists
    `

    const tableExists = result.rows[0].table_exists

    if (tableExists) {
      const products = await sql`SELECT * FROM products ORDER BY id`
      
      return NextResponse.json({
        success: true,
        table_exists: true,
        products_count: products.rows.length,
        products: products.rows
      })
    } else {
      return NextResponse.json({
        success: true,
        table_exists: false,
        message: '请执行POST请求初始化数据库'
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
