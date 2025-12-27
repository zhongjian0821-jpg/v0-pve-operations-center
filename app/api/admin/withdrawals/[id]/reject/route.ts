import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { logAdminOperation } from '@/lib/logs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = requireAdmin(request);
    const { reason } = await request.json();

    await sql`
      UPDATE withdrawals 
      SET status = 'rejected', processed_at = NOW()
      WHERE id = ${params.id}
    `;

    await logAdminOperation(
      admin.adminId,
      'reject_withdrawal',
      'withdrawal',
      params.id,
      { reason }
    );

    return successResponse({ message: 'Withdrawal rejected' });
  } catch (error: any) {
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
