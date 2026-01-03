import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// GET - 获取所有产品
export async function GET() {
  try {
    const result = await sql`
      SELECT 
        id,
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
      FROM products
      ORDER BY 
        CASE node_type 
          WHEN 'cloud' THEN 1 
          WHEN 'image' THEN 2 
        END
    `

    return NextResponse.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取产品失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取产品失败'
    }, { status: 500 })
  }
}

// PUT - 更新产品
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, base_price, staking_required, is_active } = body

    await sql`
      UPDATE products
      SET 
        name = ${name},
        description = ${description},
        base_price = ${base_price},
        staking_required = ${staking_required},
        is_active = ${is_active},
        updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: '产品更新成功'
    })
  } catch (error) {
    console.error('更新产品失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新产品失败'
    }, { status: 500 })
  }
}

// POST - 创建产品 (如果需要)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      product_id, 
      name, 
      description, 
      node_type, 
      order_type, 
      base_price, 
      staking_required,
      features 
    } = body

    const result = await sql`
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
        ${product_id},
        ${name},
        ${description},
        ${node_type},
        ${order_type},
        ${base_price || 0},
        ${staking_required || 0},
        true,
        ${JSON.stringify(features || [])},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('创建产品失败:', error)
    return NextResponse.json({
      success: false,
      error: '创建产品失败'
    }, { status: 500 })
  }
}
