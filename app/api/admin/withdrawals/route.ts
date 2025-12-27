import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const withdrawals = await sql`
      SELECT * FROM withdrawals 
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    return successResponse({ withdrawals });
  } catch (error: any) {
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
