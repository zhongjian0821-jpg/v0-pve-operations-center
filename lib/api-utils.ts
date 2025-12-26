// lib/api-utils.ts
// API 响应和错误处理工具

import { NextResponse } from 'next/server'

// 统一成功响应格式
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

// 统一错误响应格式
export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

// 成功响应
export function apiSuccess<T = any>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status }
  )
}

// 错误响应
export function apiError(
  error: string,
  code?: string,
  status: number = 400,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details
    },
    { status }
  )
}

// HTTP 状态码常量
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const

// 错误代码常量
export const ErrorCodes = {
  // 认证错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 权限错误
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // 资源错误
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // 业务逻辑错误
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  WALLET_BANNED: 'WALLET_BANNED',
  WITHDRAWAL_ALREADY_PROCESSED: 'WITHDRAWAL_ALREADY_PROCESSED',
  
  // 系统错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const

// 快捷错误响应函数

export function unauthorized(message: string = 'Unauthorized') {
  return apiError(message, ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED)
}

export function forbidden(message: string = 'Forbidden') {
  return apiError(message, ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN)
}

export function notFound(resource: string = 'Resource') {
  return apiError(`${resource} not found`, ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND)
}

export function validationError(message: string, details?: any) {
  return apiError(message, ErrorCodes.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, details)
}

export function internalError(message: string = 'Internal server error') {
  return apiError(message, ErrorCodes.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
}

// 请求参数验证

export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'email' | 'address'
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  valid: boolean
  errors: { [key: string]: string }
}

// 验证请求数据
export function validateData(
  data: any,
  schema: ValidationSchema
): ValidationResult {
  const errors: { [key: string]: string } = {}

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]

    // 检查必填
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`
      continue
    }

    // 如果不是必填且值为空，跳过其他验证
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue
    }

    // 类型检查
    if (rules.type) {
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors[field] = `${field} must be a string`
          }
          break
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors[field] = `${field} must be a number`
          }
          break
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors[field] = `${field} must be a boolean`
          }
          break
        case 'email':
          if (typeof value !== 'string' || !isValidEmail(value)) {
            errors[field] = `${field} must be a valid email`
          }
          break
        case 'address':
          if (typeof value !== 'string' || !isValidAddress(value)) {
            errors[field] = `${field} must be a valid wallet address`
          }
          break
      }
    }

    // 长度/范围检查
    if (rules.min !== undefined) {
      if (typeof value === 'string' && value.length < rules.min) {
        errors[field] = `${field} must be at least ${rules.min} characters`
      } else if (typeof value === 'number' && value < rules.min) {
        errors[field] = `${field} must be at least ${rules.min}`
      }
    }

    if (rules.max !== undefined) {
      if (typeof value === 'string' && value.length > rules.max) {
        errors[field] = `${field} must be at most ${rules.max} characters`
      } else if (typeof value === 'number' && value > rules.max) {
        errors[field] = `${field} must be at most ${rules.max}`
      }
    }

    // 正则表达式检查
    if (rules.pattern && typeof value === 'string') {
      if (!rules.pattern.test(value)) {
        errors[field] = `${field} has invalid format`
      }
    }

    // 自定义验证
    if (rules.custom) {
      const result = rules.custom(value)
      if (result !== true) {
        errors[field] = typeof result === 'string' ? result : `${field} is invalid`
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// 辅助验证函数

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidAddress(address: string): boolean {
  // 以太坊地址格式：0x 开头，40个十六进制字符
  const addressRegex = /^0x[a-fA-F0-9]{40}$/
  return addressRegex.test(address)
}

// 分页参数解析
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)

  return {
    page: Math.max(1, page),
    pageSize: Math.min(Math.max(1, pageSize), 100) // 限制最大 100
  }
}

// 错误处理包装器
export async function handleApiRequest<T>(
  handler: () => Promise<T>
): Promise<NextResponse<ApiSuccessResponse<T> | ApiErrorResponse>> {
  try {
    const result = await handler()
    return apiSuccess(result)
  } catch (error: any) {
    console.error('API Error:', error)
    
    // 根据错误类型返回适当的响应
    if (error.message === 'Unauthorized' || error.message.includes('token')) {
      return unauthorized(error.message)
    }
    
    if (error.message === 'Forbidden' || error.message.includes('permission')) {
      return forbidden(error.message)
    }
    
    if (error.message.includes('not found')) {
      return notFound(error.message)
    }
    
    return internalError(error.message || 'An unexpected error occurred')
  }
}

// CORS 头设置（如果需要）
export function setCorsHeaders(response: NextResponse): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  
  response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0])
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

// 生成唯一 ID
export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}${timestamp}${random}`
}

// 生成订单号
export function generateOrderNumber(): string {
  return generateUniqueId('ORD-')
}
