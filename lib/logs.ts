// lib/logs.ts
// 操作日志记录工具

import { sql } from './db'

export interface LogOperationParams {
  admin_id: number
  action: string
  target_type: string
  target_id: string
  details?: any
  ip_address?: string
  user_agent?: string
}

// 记录管理员操作
export async function logOperation(params: LogOperationParams): Promise<void> {
  const {
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  } = params

  try {
    await sql(
      `INSERT INTO operation_logs (
        admin_id,
        action,
        target_type,
        target_id,
        details,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        admin_id,
        action,
        target_type,
        target_id,
        details ? JSON.stringify(details) : null,
        ip_address || null,
        user_agent || null
      ]
    )
  } catch (error) {
    console.error('Failed to log operation:', error)
    // 不抛出错误，避免影响主业务逻辑
  }
}

// 操作类型常量
export const LogActions = {
  // 认证相关
  ADMIN_LOGIN: 'admin_login',
  ADMIN_LOGOUT: 'admin_logout',
  
  // 会员管理
  WALLET_VIEW: 'wallet_view',
  WALLET_EDIT: 'wallet_edit',
  WALLET_BAN: 'wallet_ban',
  WALLET_UNBAN: 'wallet_unban',
  
  // 节点管理
  NODE_VIEW: 'node_view',
  NODE_CREATE: 'node_create',
  NODE_EDIT: 'node_edit',
  NODE_DELETE: 'node_delete',
  
  // 提现管理
  WITHDRAWAL_VIEW: 'withdrawal_view',
  WITHDRAWAL_APPROVE: 'withdrawal_approve',
  WITHDRAWAL_REJECT: 'withdrawal_reject',
  
  // 订单管理
  ORDER_VIEW: 'order_view',
  ORDER_EDIT: 'order_edit',
  ORDER_CANCEL: 'order_cancel',
  
  // 设备分配
  DEVICE_ASSIGN: 'device_assign',
  DEVICE_UNASSIGN: 'device_unassign',
  
  // 系统配置
  CONFIG_UPDATE: 'config_update',
  ADMIN_CREATE: 'admin_create',
  ADMIN_EDIT: 'admin_edit'
} as const

// 目标类型常量
export const LogTargetTypes = {
  WALLET: 'wallet',
  NODE: 'node',
  WITHDRAWAL: 'withdrawal',
  ORDER: 'order',
  DEVICE: 'device',
  ADMIN: 'admin',
  CONFIG: 'config'
} as const

// 便捷日志函数

export async function logWalletAction(
  admin_id: number,
  action: string,
  wallet_address: string,
  details?: any,
  ip_address?: string,
  user_agent?: string
) {
  await logOperation({
    admin_id,
    action,
    target_type: LogTargetTypes.WALLET,
    target_id: wallet_address,
    details,
    ip_address,
    user_agent
  })
}

export async function logNodeAction(
  admin_id: number,
  action: string,
  node_id: string,
  details?: any,
  ip_address?: string,
  user_agent?: string
) {
  await logOperation({
    admin_id,
    action,
    target_type: LogTargetTypes.NODE,
    target_id: node_id,
    details,
    ip_address,
    user_agent
  })
}

export async function logWithdrawalAction(
  admin_id: number,
  action: string,
  withdrawal_id: string,
  details?: any,
  ip_address?: string,
  user_agent?: string
) {
  await logOperation({
    admin_id,
    action,
    target_type: LogTargetTypes.WITHDRAWAL,
    target_id: withdrawal_id,
    details,
    ip_address,
    user_agent
  })
}

export async function logOrderAction(
  admin_id: number,
  action: string,
  order_id: string,
  details?: any,
  ip_address?: string,
  user_agent?: string
) {
  await logOperation({
    admin_id,
    action,
    target_type: LogTargetTypes.ORDER,
    target_id: order_id,
    details,
    ip_address,
    user_agent
  })
}

// 查询日志
export interface LogQuery {
  admin_id?: number
  action?: string
  target_type?: string
  target_id?: string
  start_date?: Date
  end_date?: Date
  page?: number
  pageSize?: number
}

export async function queryLogs(params: LogQuery) {
  const {
    admin_id,
    action,
    target_type,
    target_id,
    start_date,
    end_date,
    page = 1,
    pageSize = 20
  } = params

  const conditions: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (admin_id) {
    conditions.push(`admin_id = $${paramIndex++}`)
    values.push(admin_id)
  }

  if (action) {
    conditions.push(`action = $${paramIndex++}`)
    values.push(action)
  }

  if (target_type) {
    conditions.push(`target_type = $${paramIndex++}`)
    values.push(target_type)
  }

  if (target_id) {
    conditions.push(`target_id = $${paramIndex++}`)
    values.push(target_id)
  }

  if (start_date) {
    conditions.push(`created_at >= $${paramIndex++}`)
    values.push(start_date)
  }

  if (end_date) {
    conditions.push(`created_at <= $${paramIndex++}`)
    values.push(end_date)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 获取总数
  const countQuery = `SELECT COUNT(*) as count FROM operation_logs ${whereClause}`
  const countResult = await sql(countQuery, values)
  const total = countResult[0]?.count || 0

  // 获取数据
  const offset = (page - 1) * pageSize
  const dataQuery = `
    SELECT 
      l.*,
      a.username as admin_username,
      a.email as admin_email
    FROM operation_logs l
    LEFT JOIN admins a ON l.admin_id = a.id
    ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  const logs = await sql(dataQuery, [...values, pageSize, offset])

  return {
    data: logs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}
