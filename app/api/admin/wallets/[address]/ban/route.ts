import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { logAdminOperation } from '@/lib/logs';

export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const admin = requireAdmin(request);
    const { reason } = await request.json();

    await sql`
      UPDATE wallets 
      SET status = 'banned' 
      WHERE wallet_address = ${params.address}
    `;

    await logAdminOperation(
      admin.adminId,
      'ban_wallet',
      'wallet',
      params.address,
      { reason }
    );

    return successResponse({ message: 'Wallet banned successfully' });
  } catch (error: any) {
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
