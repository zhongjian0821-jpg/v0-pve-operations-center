export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      imageName,
      txHash
    } = body;

    if (!walletAddress || !imageName) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 镜像价格
    const imagePriceUSD = 100;
    const ashvaPrice = 0.00008291;
    const imagePriceAshva = imagePriceUSD / ashvaPrice;

    const nodeId = `image-${Date.now()}`;
    
    const result = await query(
      `INSERT INTO nodes (
        node_id, wallet_address, node_type, status,
        purchase_price, staking_amount, staking_required_usd, staking_status,
        is_transferable, tx_hash, install_command
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *`,
      [
        nodeId, walletAddress, 'image', 'pending',
        imagePriceAshva, 0, 0, 'not_required',
        false, txHash, `curl -sSL https://install.ashva.io/${nodeId} | bash`
      ]
    );

    return NextResponse.json({
      success: true,
      data: {
        message: '成功购买镜像',
        nodeId: result[0].node_id,
        installCommand: result[0].install_command
      }
    });

  } catch (error: any) {
    console.error('[API] 购买镜像失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '购买失败' },
      { status: 500 }
    );
  }
}
