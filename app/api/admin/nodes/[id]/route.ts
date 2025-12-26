// app/api/admin/nodes/[id]/route.ts
// 节点详情、编辑和删除 API

import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { authenticateAdmin, getClientIP, getUserAgent } from '@/lib/auth'
import { apiSuccess, unauthorized, notFound, internalError, validationError } from '@/lib/api-utils'
import { logNodeAction, LogActions } from '@/lib/logs'

// GET - 获取节点详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await authenticateAdmin(request)
    const { id } = params

    // 获取节点信息
    const nodeResult = await sql(
      `SELECT 
        n.*,
        w.username as owner_username,
        w.email as owner_email,
        w.member_level as owner_level
       FROM nodes n
       LEFT JOIN wallets w ON n.wallet_address = w.wallet_address
       WHERE n.node_id = $1`,
      [id]
    )

    if (nodeResult.length === 0) {
      return notFound('Node')
    }

    const node = nodeResult[0]

    // 获取收益记录
    const incomeRecords = await sql(
      `SELECT * FROM assigned_records 
       WHERE device_id = $1 
       ORDER BY record_date DESC 
       LIMIT 30`,
      [id]
    )

    // 获取质押记录
    const stakingRecords = await sql(
      `SELECT * FROM staking_records 
       WHERE node_id = $1 
       ORDER BY created_at DESC`,
      [id]
    )

    // 获取转让记录（如果有）
    const listingRecords = await sql(
      `SELECT * FROM node_listings 
       WHERE node_id = $1 
       ORDER BY created_at DESC`,
      [id]
    )

    // 记录查看操作
    await logNodeAction(
      admin.id,
      LogActions.NODE_VIEW,
      id,
      null,
      getClientIP(request),
      getUserAgent(request)
    )

    return apiSuccess({
      node,
      incomeRecords,
      stakingRecords,
      listingRecords
    })
  } catch (error: any) {
    console.error('Get node detail error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to get node details')
  }
}

// PUT - 编辑节点信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await authenticateAdmin(request)
    const { id } = params
    const body = await request.json()

    // 验证节点是否存在
    const nodeCheck = await sql(
      `SELECT node_id FROM nodes WHERE node_id = $1`,
      [id]
    )

    if (nodeCheck.length === 0) {
      return notFound('Node')
    }

    // 允许编辑的字段
    const allowedFields = [
      'device_serial',
      'location',
      'ip_address',
      'maintenance_notes',
      'status',
      'cpu_cores',
      'memory_gb',
      'storage_gb'
    ]
    
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`)
        values.push(body[field])
      }
    }

    if (updates.length === 0) {
      return validationError('No valid fields to update')
    }

    // 添加 updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    // 添加 node_id 到 values
    values.push(id)

    // 执行更新
    const updateQuery = `
      UPDATE nodes 
      SET ${updates.join(', ')}
      WHERE node_id = $${paramIndex}
      RETURNING *
    `

    const result = await sql(updateQuery, values)

    // 记录操作
    await logNodeAction(
      admin.id,
      LogActions.NODE_EDIT,
      id,
      { updated_fields: Object.keys(body) },
      getClientIP(request),
      getUserAgent(request)
    )

    return apiSuccess(result[0], 'Node updated successfully')
  } catch (error: any) {
    console.error('Update node error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to update node')
  }
}

// DELETE - 删除节点
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await authenticateAdmin(request)
    const { id } = params

    // 验证节点是否存在
    const nodeCheck = await sql(
      `SELECT node_id FROM nodes WHERE node_id = $1`,
      [id]
    )

    if (nodeCheck.length === 0) {
      return notFound('Node')
    }

    // 删除节点（注意：可能需要先删除相关联的记录）
    await sql(`DELETE FROM nodes WHERE node_id = $1`, [id])

    // 记录操作
    await logNodeAction(
      admin.id,
      LogActions.NODE_DELETE,
      id,
      null,
      getClientIP(request),
      getUserAgent(request)
    )

    return apiSuccess(null, 'Node deleted successfully')
  } catch (error: any) {
    console.error('Delete node error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    // 可能是外键约束错误
    if (error.message.includes('foreign key') || error.message.includes('violates')) {
      return validationError('Cannot delete node with existing records')
    }
    
    return internalError('Failed to delete node')
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
