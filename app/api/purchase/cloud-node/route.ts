export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      cpuCores,
      memoryGb,
      storageGb,
      nodeCount = 1,
      txHash
    } = body;

    if (!walletAddress || !cpuCores || !memoryGb || !storageGb) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 计算价格 (简化版，实际应该从配置读取)
    const nodePriceUSD = 2000; // $2000 per cloud node
    const ashvaPrice = 0.00008291; // 应该从实时价格API获取
    const nodePriceAshva = nodePriceUSD / ashvaPrice;
    
    // 质押要求
    const stakingAmount = nodePriceAshva * 1.5; // 150% of purchase price

    const createdNodes = [];

    for (let i = 0; i < nodeCount; i++) {
      const nodeId = `cloud-${Date.now()}-${i}`;
      
      const result = await query(
        `INSERT INTO nodes (
          node_id, wallet_address, node_type, status,
          purchase_price, staking_amount, staking_required_usd, staking_status,
          cpu_cores, memory_gb, storage_gb,
          uptime_percentage, data_transferred_gb, is_transferable, tx_hash
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING *`,
        [
          nodeId, walletAddress, 'cloud', 'deploying',
          nodePriceAshva, stakingAmount, nodePriceUSD, 'pending',
          cpuCores, memoryGb, storageGb,
          99.9, 0, true, txHash
        ]
      );

      createdNodes.push(result[0]);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `成功创建 ${nodeCount} 个云节点`,
        nodes: createdNodes.map(n => n.node_id)
      }
    });

  } catch (error: any) {
    console.error('[API] 购买云节点失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '购买失败' },
      { status: 500 }
    );
  }
}
