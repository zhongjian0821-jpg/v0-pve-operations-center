import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const totalNodes = await sql`SELECT COUNT(*) as count FROM nodes`;
    const activeNodes = await sql`
      SELECT COUNT(*) as count FROM nodes WHERE status = 'active'
    `;

    return successResponse({
      total: Number(totalNodes[0].count),
      active: Number(activeNodes[0].count)
    });
  } catch (error: any) {
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
