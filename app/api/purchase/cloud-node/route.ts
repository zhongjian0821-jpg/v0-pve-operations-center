// app/api/purchase/cloud-node/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      walletAddress,
      nodeCount = 1,
      cpuCores = 8,
      memoryGb = 16,
      storageGb = 500,
      stakingAmount,
      txHash
    } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    console.log('[API] 购买云节点:', { walletAddress, nodeCount, cpuCores, memoryGb, storageGb });

    // 云节点价格：2000 USD
    const nodePrice USD = 2000;
    const ashvaPrice = parseFloat(process.env.NEXT_PUBLIC_ASHVA_PRICE || '0.00008291');
    const nodePriceAshva = nodePriceUSD / ashvaPrice;
    const totalPriceAshva = nodePriceAshva * nodeCount;

    // 创建节点记录
    const createdNodes = [];
    
    for (let i = 0; i < nodeCount; i++) {
      const nodeId = `cloud-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await query(`
        INSERT INTO nodes (
          node_id,
          wallet_address,
          node_type,
          status,
          purchase_price,
          staking_amount,
          staking_required_usd,
          staking_status,
          cpu_cores,
          memory_gb,
          storage_gb,
          uptime_percentage,
          data_transferred_gb,
          is_transferable,
          tx_hash,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
        )
        RETURNING *
      `, [
        nodeId,
        walletAddress,
        'cloud',
        'deploying',
        nodePriceAshva,
        stakingAmount || 0,
        nodePrice USD,
        stakingAmount ? 'staked' : 'not_required',
        cpuCores,
        memoryGb,
        storageGb,
        99.9,
        0,
        true,
        txHash
      ]);
      
      createdNodes.push(result[0]);
    }

    console.log('[API] 云节点创建成功:', createdNodes.length);

    return NextResponse.json({
      success: true,
      data: {
        nodes: createdNodes.map(node => ({
          nodeId: node.node_id,
          status: node.status,
          price: nodePriceAshva,
          priceFormatted: `${nodePriceAshva.toFixed(2)} ASHVA`,
          specs: {
            cpu: node.cpu_cores,
            memory: node.memory_gb,
            storage: node.storage_gb
          }
        })),
        totalPrice: totalPriceAshva,
        totalPriceFormatted: `${totalPriceAshva.toFixed(2)} ASHVA`
      }
    });

  } catch (error: any) {
    console.error('[API] 购买云节点失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
