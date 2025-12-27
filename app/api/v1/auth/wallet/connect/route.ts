import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { verifySignature, generateUserToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const { address, signature, message } = await request.json();

    if (!verifySignature(message, signature, address)) {
      return errorResponse('Invalid signature', 401);
    }

    let wallet = await sql`
      SELECT * FROM wallets WHERE wallet_address = ${address.toLowerCase()}
    `;

    if (wallet.length === 0) {
      await sql`
        INSERT INTO wallets (wallet_address) 
        VALUES (${address.toLowerCase()})
      `;
      
      wallet = await sql`
        SELECT * FROM wallets WHERE wallet_address = ${address.toLowerCase()}
      `;
    }

    const token = generateUserToken(address.toLowerCase());

    return successResponse({
      token,
      wallet: wallet[0]
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
