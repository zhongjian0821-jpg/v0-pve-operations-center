import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    requireAdmin(request);
    
    const wallets = await sql`
      SELECT * FROM wallets WHERE wallet_address = ${params.address}
    `;

    if (wallets.length === 0) {
      return errorResponse('Wallet not found', 404);
    }

    return successResponse({ wallet: wallets[0] });
  } catch (error: any) {
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
