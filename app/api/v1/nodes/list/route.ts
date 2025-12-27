import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireUser, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const user = requireUser(request);

    const nodes = await sql`
      SELECT * FROM nodes 
      WHERE owner_address = ${user.walletAddress}
      ORDER BY created_at DESC
    `;

    return successResponse({ nodes });
  } catch (error: any) {
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
