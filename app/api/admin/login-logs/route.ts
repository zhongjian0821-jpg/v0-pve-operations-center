import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let records;
    
    if (username) {
      records = await sql`
        SELECT * FROM login_logs 
        WHERE username = ${username}
        ORDER BY login_time DESC 
        LIMIT ${limit}
      `;
    } else {
      records = await sql`
        SELECT * FROM login_logs 
        ORDER BY login_time DESC 
        LIMIT ${limit}
      `;
    }
    
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

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
    
    return successResponse(result[0]);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const result = await sql`
      DELETE FROM login_logs
      WHERE login_time < NOW() - INTERVAL '1 day' * ${days}
      RETURNING id
    `;
    
    return successResponse({
      message: `Deleted logs older than ${days} days`,
      deleted_count: result.length
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
