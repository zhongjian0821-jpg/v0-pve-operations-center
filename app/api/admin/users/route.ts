import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const record = await sql`SELECT * FROM users WHERE id = ${id}`;
      return successResponse(record[0] || null);
    }
    
    const records = await sql`SELECT * FROM users ORDER BY created_at DESC`;
    return successResponse({ records, total: records.length });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    
    // 这里需要根据具体表添加字段
    const result = await sql`
      INSERT INTO users DEFAULT VALUES RETURNING *
    `;
    
    return successResponse(result[0]);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
