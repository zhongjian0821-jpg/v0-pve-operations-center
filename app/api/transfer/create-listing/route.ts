export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId, sellerWallet, askingPrice, description } = body;

    if (!nodeId || !sellerWallet || !askingPrice) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查节点所有权
    const nodeResult = await query(
      `SELECT * FROM nodes
      WHERE node_id = $1 AND LOWER(wallet_address) = LOWER($2)
      AND is_transferable = true`,
      [nodeId, sellerWallet]
    );

    if (nodeResult.length === 0) {
      return NextResponse.json(
        { success: false, error: '节点不存在或不可转让' },
        { status: 404 }
      );
    }

    const listingId = `LST-${Date.now()}`;

    await query(
      `INSERT INTO node_listings (
        listing_id, node_id, seller_wallet, asking_price, status, description
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [listingId, nodeId, sellerWallet, askingPrice, 'active', description || '']
    );

    return NextResponse.json({
      success: true,
      data: { listingId, message: '挂单创建成功' }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
