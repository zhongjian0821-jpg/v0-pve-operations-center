export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('wallet_address') || searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let sql = `SELECT * FROM devices`;
    const params: any[] = [];
    
    if (filter) {
      sql += ` WHERE LOWER(wallet_address) = LOWER($1) LIMIT $2`;
      params.push(filter, limit);
    } else {
      sql += ` LIMIT $1`;
      params.push(limit);
    }
    
    const result = await query(sql, params);
    return NextResponse.json({ success: true, data: { items: result, total: result.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}