import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireUser, successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const user = requireUser(request);
    const { amount, toAddress } = await request.json();

    const result = await sql`
      INSERT INTO withdrawals (wallet_address, amount, to_address, status)
      VALUES (${user.walletAddress}, ${amount}, ${toAddress}, 'pending')
      RETURNING *
    `;

    return successResponse({ withdrawal: result[0] });
  } catch (error: any) {
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
