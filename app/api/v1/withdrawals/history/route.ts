import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    if (!wallet) return errorResponse('缺少wallet参数', 400);

    const history = await sql`
      SELECT * FROM withdrawals WHERE LOWER(wallet_address) = LOWER(${wallet}) ORDER BY created_at DESC
    `;

    return successResponse(history);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
