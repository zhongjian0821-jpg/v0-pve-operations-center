import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, amount } = body;

    const wallet = await sql`SELECT total_earnings FROM wallets WHERE LOWER(wallet_address) = LOWER(${wallet_address})`;
    if (wallet.length === 0) return errorResponse('钱包不存在', 404);
    if (Number(wallet[0].total_earnings) < amount) return errorResponse('余额不足', 400);

    const withdrawal = await sql`
      INSERT INTO withdrawals (wallet_address, amount, status, created_at)
      VALUES (${wallet_address.toLowerCase()}, ${amount}, 'pending', NOW())
      RETURNING *
    `;

    return successResponse(withdrawal[0], '提现申请创建成功');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
