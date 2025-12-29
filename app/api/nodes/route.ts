// app/api/nodes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const status = searchParams.get('status'); // 可选过滤
    const nodeType = searchParams.get('type'); // cloud 或 image

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    console.log('[API] 获取节点列表:', { address, status, nodeType });

    // 构建查询条件
    let whereConditions = ['LOWER(wallet_address) = LOWER($1)'];
    const params: any[] = [address];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (nodeType) {
      whereConditions.push(`node_type = $${paramIndex}`);
      params.push(nodeType);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询节点
    const nodes = await query(`
      SELECT 
        node_id,
        wallet_address,
        node_type,
        status,
        purchase_price,
        staking_amount,
        staking_required_usd,
        staking_status,
        total_earnings,
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
        install_command,
        created_at,
        updated_at
      FROM nodes
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `, params);

    console.log('[API] 找到节点:', nodes.length);

    // 格式化节点数据
    const formattedNodes = nodes.map((node: any) => ({
      id: node.node_id,
      nodeId: node.node_id,
      walletAddress: node.wallet_address,
      
      // 节点类型和状态
      type: node.node_type,
      status: node.status,
      
      // 规格信息
      specs: {
        cpu: node.cpu_cores || 0,
        memory: node.memory_gb || 0,
        storage: node.storage_gb || 0
      },
      
      // 性能指标
      performance: {
        cpuUsage: parseFloat(node.cpu_usage_percentage || '0'),
        memoryUsage: parseFloat(node.memory_usage_percentage || '0'),
        storageUsage: parseFloat(node.storage_used_percentage || '0'),
        uptime: parseFloat(node.uptime_percentage || '99.9'),
        dataTransferred: parseFloat(node.data_transferred_gb || '0')
      },
      
      // 收益信息
      earnings: {
        total: parseFloat(node.total_earnings || '0'),
        totalFormatted: `${parseFloat(node.total_earnings || '0').toFixed(2)} ASHVA`
      },
      
      // 质押信息
      staking: {
        amount: parseFloat(node.staking_amount || '0'),
        requiredUSD: parseFloat(node.staking_required_usd || '0'),
        status: node.staking_status || 'not_required'
      },
      
      // 购买和交易信息
      purchase: {
        price: parseFloat(node.purchase_price || '0'),
        txHash: node.tx_hash,
        date: node.created_at
      },
      
      // 转让信息
      transfer: {
        isTransferable: node.is_transferable !== false
      },
      
      // 安装信息（仅镜像节点）
      install: node.node_type === 'image' ? {
        command: node.install_command
      } : null,
      
      // 时间信息
      createdAt: node.created_at,
      updatedAt: node.updated_at
    }));

    // 统计信息
    const stats = {
      total: formattedNodes.length,
      byType: {
        cloud: formattedNodes.filter(n => n.type === 'cloud').length,
        image: formattedNodes.filter(n => n.type === 'image').length
      },
      byStatus: {
        active: formattedNodes.filter(n => n.status === 'active').length,
        pending: formattedNodes.filter(n => n.status === 'pending').length,
        deploying: formattedNodes.filter(n => n.status === 'deploying').length,
        stopped: formattedNodes.filter(n => n.status === 'stopped').length,
        error: formattedNodes.filter(n => n.status === 'error').length
      },
      totalEarnings: formattedNodes.reduce((sum, n) => sum + n.earnings.total, 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        nodes: formattedNodes,
        stats: stats
      }
    });

  } catch (error: any) {
    console.error('[API] 节点列表查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
