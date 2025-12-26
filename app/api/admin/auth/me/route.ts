// app/api/admin/auth/me/route.ts
// 获取当前管理员信息 API

import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { authenticateAdmin } from '@/lib/auth'
import { apiSuccess, unauthorized, internalError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const admin = await authenticateAdmin(request)

    // 获取完整的管理员信息
    const result = await sql(
      `SELECT 
        id, username, email, role, permissions, 
        is_active, last_login_at, last_login_ip,
        created_at, updated_at
      FROM admins
      WHERE id = $1`,
      [admin.id]
    )

    if (result.length === 0) {
      return unauthorized('Admin not found')
    }

    const adminInfo = result[0]

    return apiSuccess({
      admin: {
        id: adminInfo.id,
        username: adminInfo.username,
        email: adminInfo.email,
        role: adminInfo.role,
        permissions: adminInfo.permissions,
        is_active: adminInfo.is_active,
        last_login_at: adminInfo.last_login_at,
        last_login_ip: adminInfo.last_login_ip,
        created_at: adminInfo.created_at,
        updated_at: adminInfo.updated_at
      }
    })
  } catch (error: any) {
    console.error('Get admin info error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authentication')) {
      return unauthorized(error.message)
    }
    
    return internalError('Failed to get admin information')
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
