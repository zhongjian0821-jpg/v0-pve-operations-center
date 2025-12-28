import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

// GET - 获取登录日志
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const limit = searchParams.get('limit') || '100';
    
    let query = `SELECT * FROM login_logs WHERE 1=1`;
    const params: any[] = [];
    
    if (username) {
      params.push(username);
      query += ` AND username = $${params.length}`;
    }
    
    query += ` ORDER BY login_time DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const records = await sql.unsafe(query, params);
    
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST - 记录登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      username,
      ip_address,
      user_agent,
      success = true,
      failure_reason
    } = body;
    
    const result = await sql`
      INSERT INTO login_logs (
        user_id, username, ip_address, user_agent, success, failure_reason
      )
      VALUES (
        ${user_id}, ${username}, ${ip_address}, ${user_agent}, ${success}, ${failure_reason}
      )
      RETURNING *
    `;
    
    return successResponse(result[0], 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE - 清理旧日志
export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30';
    
    const result = await sql`
      DELETE FROM login_logs
      WHERE login_time < NOW() - INTERVAL '${days} days'
      RETURNING COUNT(*) as deleted_count
    `;
    
    return successResponse({
      message: `Deleted logs older than ${days} days`,
      deleted_count: result.length
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
