export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, sellerWallet } = body;

    if (!listingId || !sellerWallet) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE node_listings
      SET status = 'cancelled'
      WHERE listing_id = $1 AND LOWER(seller_wallet) = LOWER($2) AND status = 'active'
      RETURNING *`,
      [listingId, sellerWallet]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: '挂单不存在或无权取消' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: '挂单已取消' }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
