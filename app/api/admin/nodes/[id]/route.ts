import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const nodes = await sql`
      SELECT * FROM nodes WHERE id = ${params.id}
    `;

    if (nodes.length === 0) {
      return errorResponse('Node not found', 404);
    }

    return successResponse({ node: nodes[0] });
  } catch (error: any) {
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
