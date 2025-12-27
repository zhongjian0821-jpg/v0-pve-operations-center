import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireUser, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const user = requireUser(request);

    const wallets = await sql`
      SELECT * FROM wallets WHERE wallet_address = ${user.walletAddress}
    `;

    if (wallets.length === 0) {
      return errorResponse('User not found', 404);
    }

    return successResponse({ profile: wallets[0] });
  } catch (error: any) {
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
