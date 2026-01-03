import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  try {
    console.log('开始插入产品数据...')

    // 插入云节点托管
    const result1 = await sql`
      INSERT INTO products (
        product_id, 
        name, 
        description, 
        node_type, 
        order_type, 
        base_price, 
        staking_required, 
        is_active, 
        features, 
        created_at, 
        updated_at
      ) VALUES (
        'cloud-hosting',
        '云节点托管',
        '高性能云服务器托管服务,提供24/7稳定运行的区块链节点',
        'cloud',
        'hosting',
        100.00,
        50.00,
        true,
        '["24/7运行", "高性能CPU", "灵活配置", "自动备份", "实时监控"]'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (product_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        staking_required = EXCLUDED.staking_required,
        features = EXCLUDED.features,
        updated_at = NOW()
      RETURNING *
    `

    console.log('云节点托管插入成功')

    // 插入镜像节点  
    const result2 = await sql`
      INSERT INTO products (
        product_id,
        name,
        description,
        node_type,
        order_type,
        base_price,
        staking_required,
        is_active,
        features,
        created_at,
        updated_at
      ) VALUES (
        'image-node',
        '镜像节点',
        '区块链数据镜像存储节点,提供高可用的分布式存储服务',
        'image',
        'image',
        200.00,
        100.00,
        true,
        '["数据镜像", "分布式存储", "高可用性", "自动同步", "安全加密"]'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (product_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        staking_required = EXCLUDED.staking_required,
        features = EXCLUDED.features,
        updated_at = NOW()
      RETURNING *
    `

    console.log('镜像节点插入成功')

    // 查询所有产品
    const allProducts = await sql`
      SELECT * FROM products ORDER BY id
    `

    return NextResponse.json({
      success: true,
      message: '产品数据插入成功',
      inserted: [
        result1.rows[0],
        result2.rows[0]
      ],
      total_products: allProducts.rows.length,
      all_products: allProducts.rows
    })
  } catch (error: any) {
    console.error('插入产品失败:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || '插入失败',
      details: error?.toString()
    }, { status: 500 })
  }
}
