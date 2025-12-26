// lib/db.ts
// 数据库连接配置

import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// 创建 Neon 数据库连接
const sql = neon(process.env.DATABASE_URL)

export { sql }

// 数据库查询辅助函数
export async function query<T = any>(
  sqlQuery: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await sql(sqlQuery, params)
    return result as T[]
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// 单行查询
export async function queryOne<T = any>(
  sqlQuery: string,
  params: any[] = []
): Promise<T | null> {
  const result = await query<T>(sqlQuery, params)
  return result.length > 0 ? result[0] : null
}

// 事务支持
export async function transaction<T>(
  callback: (sql: typeof import('@neondatabase/serverless').neon) => Promise<T>
): Promise<T> {
  // Neon 自动处理事务
  return callback(sql)
}

// 分页查询辅助函数
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export async function paginatedQuery<T = any>(
  baseQuery: string,
  countQuery: string,
  params: any[],
  pagination: PaginationParams
): Promise<PaginationResult<T>> {
  const { page = 1, pageSize = 10 } = pagination
  const offset = (page - 1) * pageSize

  // 获取总数
  const countResult = await queryOne<{ count: number }>(countQuery, params)
  const total = countResult?.count || 0

  // 获取数据
  const query = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  const data = await sql(query, [...params, pageSize, offset])

  return {
    data: data as T[],
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}
