import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const record = await sql`SELECT * FROM devices WHERE id = ${id}`;
      return successResponse(record[0] || null);
    }
    
    const records = await sql`SELECT * FROM devices ORDER BY created_at DESC`;
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
      INSERT INTO devices DEFAULT VALUES RETURNING *
    `;
    
    return successResponse(result[0]);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { id, status } = body;
    
    if (!id || !status) return errorResponse('id and status are required', 400);
    
    const result = await sql`
      UPDATE devices
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) return errorResponse('Record not found', 404);
    return successResponse(result[0]);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return errorResponse('id is required', 400);
    
    const result = await sql`DELETE FROM devices WHERE id = ${id} RETURNING *`;
    if (result.length === 0) return errorResponse('Record not found', 404);
    
    return successResponse({ message: 'Deleted successfully', deleted: result[0] });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
