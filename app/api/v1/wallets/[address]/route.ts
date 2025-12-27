import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest, { params }: { params: { address: string } }) {
  try {
    const { address } = params;
    const wallet = await sql`
      SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER(${address})
    `;
    if (wallet.length === 0) return errorResponse('会员不存在', 404);
    return successResponse(wallet[0]);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { address: string } }) {
  try {
    const { address } = params;
    const body = await request.json();
    await sql`
      UPDATE wallets SET 
        ashva_balance = ${body.ashva_balance},
        member_level = ${body.member_level},
        commission_rate_level1 = ${body.commission_rate_level1},
        commission_rate_level2 = ${body.commission_rate_level2},
        team_size = ${body.team_size},
        updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER(${address})
    `;
    const updated = await sql`SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER(${address})`;
    return successResponse(updated[0]);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
