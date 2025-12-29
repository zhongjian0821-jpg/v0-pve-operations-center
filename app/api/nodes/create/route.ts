import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      wallet_address,
      node_type,
      cpu_cores,
      memory_gb,
      storage_gb,
      purchase_price,
      staking_amount,
      staking_required_usd,
      tx_hash
    } = body;

    // 验证必填字段
    if (!wallet_address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    if (!node_type || !['cloud', 'image'].includes(node_type)) {
      return NextResponse.json(
        { success: false, error: '节点类型必须是 cloud 或 image' },
        { status: 400 }
      );
    }

    // 生成节点ID
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('[API] 创建节点:', { nodeId, wallet_address, node_type });

    // 插入节点记录
    const result = await query(
      `INSERT INTO nodes (
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
        cpu_usage_percentage,
        memory_usage_percentage,
        storage_used_percentage,
        uptime_percentage,
        data_transferred_gb,
        is_transferable,
        tx_hash,
        total_earnings,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        nodeId,
        wallet_address,
        node_type,
        'pending',
        purchase_price || 0,
        staking_amount || 0,
        staking_required_usd || 0,
        staking_amount > 0 ? 'staked' : 'not_required',
        cpu_cores || 8,
        memory_gb || 16,
        storage_gb || 500,
        0,
        0,
        0,
        99.9,
        0,
        true,
        tx_hash || null,
        0
      ]
    );

    const newNode = result[0];

    console.log('[API] 节点创建成功:', nodeId);

    return NextResponse.json({
      success: true,
      message: '节点创建成功',
      data: {
        node_id: newNode.node_id,
        wallet_address: newNode.wallet_address,
        node_type: newNode.node_type,
        status: newNode.status,
        cpu_cores: newNode.cpu_cores,
        memory_gb: newNode.memory_gb,
        storage_gb: newNode.storage_gb,
        purchase_price: parseFloat(newNode.purchase_price || '0'),
        staking_amount: parseFloat(newNode.staking_amount || '0'),
        is_transferable: newNode.is_transferable,
        created_at: newNode.created_at
      }
    });

  } catch (error: any) {
    console.error('[API] 节点创建失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '创建失败' },
      { status: 500 }
    );
  }
}
