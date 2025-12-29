export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '50');

    let sql = `SELECT * FROM nodes WHERE node_type = 'image'`;
    const params: any[] = [];

    if (walletAddress) {
      sql += ` AND LOWER(wallet_address) = LOWER($1)`;
      params.push(walletAddress);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: { total: result.length, purchases: result }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
