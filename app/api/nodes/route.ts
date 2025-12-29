export const dynamic = 'force-dynamic';

import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址参数' },
        { status: 400 }
      );
    }

    console.log('[API] 查询节点列表:', address);

    const result = await query(
      `SELECT 
        node_id,
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
        total_earnings,
        is_transferable,
        tx_hash,
        install_command,
        created_at,
        updated_at
      FROM nodes
      WHERE LOWER(wallet_address) = LOWER($1)
      ORDER BY created_at DESC`,
      [address]
    );

    const nodes = result.map(node => ({
      id: node.node_id,
      type: node.node_type,
      status: node.status,
      price: {
        ashva: parseFloat(node.purchase_price || '0'),
        usd: parseFloat(node.staking_required_usd || '0')
      },
      staking: {
        amount: parseFloat(node.staking_amount || '0'),
        required: parseFloat(node.staking_required_usd || '0'),
        status: node.staking_status || 'not_required'
      },
      specs: {
        cpu: node.cpu_cores || 0,
        memory: node.memory_gb || 0,
        storage: node.storage_gb || 0
      },
      performance: {
        cpuUsage: parseFloat(node.cpu_usage_percentage || '0'),
        memoryUsage: parseFloat(node.memory_usage_percentage || '0'),
        storageUsage: parseFloat(node.storage_used_percentage || '0'),
        uptime: parseFloat(node.uptime_percentage || '99.9'),
        dataTransferred: parseFloat(node.data_transferred_gb || '0')
      },
      earnings: parseFloat(node.total_earnings || '0'),
      transferable: node.is_transferable !== false,
      txHash: node.tx_hash,
      installCommand: node.install_command,
      createdAt: node.created_at,
      updatedAt: node.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        total: nodes.length,
        nodes: nodes
      }
    });

  } catch (error: any) {
    console.error('[API] 节点列表查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
