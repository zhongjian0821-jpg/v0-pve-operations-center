import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const devices = await sql`
      SELECT * FROM assigned_records 
      ORDER BY assigned_at DESC
    `;

    return successResponse(devices);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return errorResponse('未授权', 401);
    return errorResponse(error.message, 500);
  }
}
