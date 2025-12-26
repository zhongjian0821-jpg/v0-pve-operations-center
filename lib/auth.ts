// lib/auth.ts
// 认证和授权中间件

import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { queryOne } from './db'

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production'
const USER_JWT_SECRET = process.env.USER_JWT_SECRET || 'user-secret-key-change-in-production'

// Token 过期时间
const TOKEN_EXPIRY = '7d' // 7天

// ==================== 管理员认证 ====================

export interface AdminPayload {
  id: number
  username: string
  role: string
  email?: string
}

// 生成管理员 token
export function generateAdminToken(admin: AdminPayload): string {
  return jwt.sign(admin, ADMIN_JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY
  })
}

// 验证管理员 token
export function verifyAdminToken(token: string): AdminPayload {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload
  } catch (error) {
    throw new Error('Invalid or expired admin token')
  }
}

// 从请求中提取并验证管理员
export async function authenticateAdmin(
  request: NextRequest
): Promise<AdminPayload> {
  // 从 header 获取 token
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided')
  }

  const token = authHeader.substring(7)
  
  try {
    const payload = verifyAdminToken(token)
    
    // 验证管理员是否仍然活跃
    const admin = await queryOne<{ is_active: boolean }>(
      'SELECT is_active FROM admins WHERE id = $1',
      [payload.id]
    )
    
    if (!admin || !admin.is_active) {
      throw new Error('Admin account is inactive')
    }
    
    return payload
  } catch (error) {
    throw new Error('Authentication failed')
  }
}

// 检查管理员权限
export function checkAdminPermission(
  admin: AdminPayload,
  requiredRole?: string
): boolean {
  if (admin.role === 'super_admin') {
    return true // 超级管理员有所有权限
  }
  
  if (requiredRole && admin.role !== requiredRole) {
    return false
  }
  
  return true
}

// ==================== 用户认证（Web3） ====================

export interface UserPayload {
  wallet_address: string
  member_level: string
}

// 生成用户 token
export function generateUserToken(user: UserPayload): string {
  return jwt.sign(user, USER_JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY
  })
}

// 验证用户 token
export function verifyUserToken(token: string): UserPayload {
  try {
    return jwt.verify(token, USER_JWT_SECRET) as UserPayload
  } catch (error) {
    throw new Error('Invalid or expired user token')
  }
}

// 从请求中提取并验证用户
export async function authenticateUser(
  request: NextRequest
): Promise<UserPayload> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided')
  }

  const token = authHeader.substring(7)
  
  try {
    const payload = verifyUserToken(token)
    
    // 验证钱包是否存在且未被封禁
    const wallet = await queryOne<{ wallet_address: string; status?: string }>(
      'SELECT wallet_address, status FROM wallets WHERE wallet_address = $1',
      [payload.wallet_address]
    )
    
    if (!wallet) {
      throw new Error('Wallet not found')
    }
    
    // 检查是否被封禁（如果有 status 字段）
    if (wallet.status && wallet.status === 'banned') {
      throw new Error('Wallet is banned')
    }
    
    return payload
  } catch (error) {
    throw new Error('Authentication failed')
  }
}

// ==================== Web3 签名验证 ====================

import { ethers } from 'ethers'

// 验证 Web3 钱包签名
export function verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// 生成登录消息
export function generateLoginMessage(address: string, nonce?: string): string {
  const timestamp = Date.now()
  const nonceStr = nonce || Math.random().toString(36).substring(7)
  
  return `Welcome to Ashva Node Platform!

Please sign this message to verify your wallet ownership.

Wallet: ${address}
Timestamp: ${timestamp}
Nonce: ${nonceStr}

This request will not trigger a blockchain transaction or cost any gas fees.`
}

// ==================== 辅助函数 ====================

// 从请求获取 IP 地址
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// 从请求获取 User Agent
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

// 密码哈希（用于管理员密码）
import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
