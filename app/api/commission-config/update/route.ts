// app/api/commission-config/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromWallet, toWallet, level, percentage, rate } = body;
    
    await query(`
      INSERT INTO commission_distribution (from_wallet, to_wallet, level, percentage, rate)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (from_wallet, to_wallet, level) DO UPDATE
      SET percentage = $4, rate = $5, updated_at = NOW()
    `, [fromWallet, toWallet, level, percentage, rate]);
    
    return NextResponse.json({ success: true, message: '配置已更新' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
