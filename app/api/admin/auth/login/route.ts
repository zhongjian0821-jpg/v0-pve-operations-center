// app/api/admin/auth/login/route.ts
// 管理员登录 API

import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { comparePassword, generateAdminToken, getClientIP, getUserAgent } from '@/lib/auth'
import { apiSuccess, apiError, validationError, HttpStatus, ErrorCodes } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // 验证输入
    if (!username || !password) {
      return validationError('Username and password are required')
    }

    // 查询管理员
    const result = await sql(
      `SELECT 
        id, username, password_hash, email, role, is_active
      FROM admins
      WHERE username = $1`,
      [username]
    )

    if (result.length === 0) {
      return apiError(
        'Invalid credentials',
        ErrorCodes.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED
      )
    }

    const admin = result[0] as {
      id: number
      username: string
      password_hash: string
      email: string
      role: string
      is_active: boolean
    }

    // 检查账号是否活跃
    if (!admin.is_active) {
      return apiError(
        'Admin account is inactive',
        ErrorCodes.FORBIDDEN,
        HttpStatus.FORBIDDEN
      )
    }

    // 验证密码
    const isValidPassword = await comparePassword(password, admin.password_hash)
    if (!isValidPassword) {
      return apiError(
        'Invalid credentials',
        ErrorCodes.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED
      )
    }

    // 更新最后登录信息
    const clientIP = getClientIP(request)
    await sql(
      `UPDATE admins 
      SET last_login_at = CURRENT_TIMESTAMP,
          last_login_ip = $1
      WHERE id = $2`,
      [clientIP, admin.id]
    )

    // 生成 token
    const token = generateAdminToken({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      email: admin.email
    })

    // 返回响应（不包含密码）
    return apiSuccess(
      {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      },
      'Login successful'
    )
  } catch (error: any) {
    console.error('Admin login error:', error)
    return apiError(
      'Login failed',
      ErrorCodes.INTERNAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR
    )
  }
}

// OPTIONS 请求处理（CORS）
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
