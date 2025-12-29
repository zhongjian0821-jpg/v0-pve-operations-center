export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, buyerWallet, txHash } = body;

    if (!listingId || !buyerWallet) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取挂单信息
    const listingResult = await query(
      `SELECT * FROM node_listings
      WHERE listing_id = $1 AND status = 'active'`,
      [listingId]
    );

    if (listingResult.length === 0) {
      return NextResponse.json(
        { success: false, error: '挂单不存在或已售出' },
        { status: 404 }
      );
    }

    const listing = listingResult[0];

    // 更新节点所有权
    await query(
      `UPDATE nodes
      SET wallet_address = $1, updated_at = NOW()
      WHERE node_id = $2`,
      [buyerWallet, listing.node_id]
    );

    // 更新挂单状态
    await query(
      `UPDATE node_listings
      SET status = 'sold', buyer_wallet = $1, sold_at = NOW()
      WHERE listing_id = $2`,
      [buyerWallet, listingId]
    );

    return NextResponse.json({
      success: true,
      data: {
        message: '购买成功',
        nodeId: listing.node_id
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
