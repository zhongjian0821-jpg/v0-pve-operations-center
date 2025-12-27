import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    if (!wallet) return errorResponse('缺少wallet参数', 400);

    const records = await sql`
      SELECT id, wallet_address, from_wallet, amount, commission_level, transaction_type, source_node_id, created_at
      FROM commission_records
      WHERE LOWER(wallet_address) = LOWER(${wallet})
      ORDER BY created_at DESC
    `;

    const summary = {
      total_commissions: records.reduce((sum: number, r: any) => sum + Number(r.amount), 0),
      transaction_count: records.length
    };

    return successResponse({ data: records, summary });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
