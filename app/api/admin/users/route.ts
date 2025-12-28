import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const result = await sql`SELECT * FROM users WHERE id = ${id}`;
      if (result.length === 0) return errorResponse('Record not found', 404);
      return successResponse(result[0]);
    }
    const records = await sql`SELECT * FROM users ORDER BY created_at DESC`;
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
