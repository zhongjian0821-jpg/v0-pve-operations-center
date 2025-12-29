// app/api/transfer/create-listing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, nodeId, askingPrice, description } = body;

    if (!walletAddress || !nodeId || !askingPrice) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const price = parseFloat(askingPrice);
    
    if (price <= 0) {
      return NextResponse.json(
        { success: false, error: '价格必须大于0' },
        { status: 400 }
      );
    }

    console.log('[API] 创建挂单:', { walletAddress, nodeId, askingPrice: price });

    // 检查节点是否存在且属于该钱包
    const nodeData = await query(`
      SELECT 
        node_id,
        wallet_address,
        is_transferable,
        status
      FROM nodes
      WHERE node_id = $1
        AND LOWER(wallet_address) = LOWER($2)
    `, [nodeId, walletAddress]);

    if (nodeData.length === 0) {
      return NextResponse.json(
        { success: false, error: '节点不存在或不属于该钱包' },
        { status: 404 }
      );
    }

    const node = nodeData[0];

    if (node.is_transferable === false) {
      return NextResponse.json(
        { success: false, error: '该节点不可转让' },
        { status: 400 }
      );
    }

    // 检查是否已有active挂单
    const existingListing = await query(`
      SELECT transfer_id
      FROM transfers
      WHERE node_id = $1 AND status = 'active'
    `, [nodeId]);

    if (existingListing.length > 0) {
      return NextResponse.json(
        { success: false, error: '该节点已在市场上挂单' },
        { status: 400 }
      );
    }

    // 创建挂单
    const transferId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await query(`
      INSERT INTO transfers (
        transfer_id,
        node_id,
        seller_wallet,
        asking_price,
        status,
        description,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [transferId, nodeId, walletAddress, price, 'active', description || '']);

    console.log('[API] 挂单创建成功:', transferId);

    return NextResponse.json({
      success: true,
      data: {
        listingId: transferId,
        nodeId: nodeId,
        askingPrice: price,
        askingPriceFormatted: `${price.toFixed(2)} ASHVA`,
        status: 'active',
        message: '节点已成功挂单到转让市场'
      }
    });

  } catch (error: any) {
    console.error('[API] 创建挂单失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
