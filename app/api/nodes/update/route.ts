import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      node_id,
      status,
      cpu_usage_percentage,
      memory_usage_percentage,
      storage_used_percentage,
      uptime_percentage,
      data_transferred_gb,
      total_earnings,
      is_transferable,
      staking_status
    } = body;

    // 验证必填字段
    if (!node_id) {
      return NextResponse.json(
        { success: false, error: '缺少节点ID' },
        { status: 400 }
      );
    }

    console.log('[API] 更新节点:', node_id);

    // 检查节点是否存在
    const existingNode = await query(
      `SELECT node_id FROM nodes WHERE node_id = $1`,
      [node_id]
    );

    if (!existingNode || existingNode.length === 0) {
      return NextResponse.json(
        { success: false, error: '节点不存在' },
        { status: 404 }
      );
    }

    // 构建更新语句
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (cpu_usage_percentage !== undefined) {
      updates.push(`cpu_usage_percentage = $${paramIndex++}`);
      values.push(cpu_usage_percentage);
    }

    if (memory_usage_percentage !== undefined) {
      updates.push(`memory_usage_percentage = $${paramIndex++}`);
      values.push(memory_usage_percentage);
    }

    if (storage_used_percentage !== undefined) {
      updates.push(`storage_used_percentage = $${paramIndex++}`);
      values.push(storage_used_percentage);
    }

    if (uptime_percentage !== undefined) {
      updates.push(`uptime_percentage = $${paramIndex++}`);
      values.push(uptime_percentage);
    }

    if (data_transferred_gb !== undefined) {
      updates.push(`data_transferred_gb = $${paramIndex++}`);
      values.push(data_transferred_gb);
    }

    if (total_earnings !== undefined) {
      updates.push(`total_earnings = $${paramIndex++}`);
      values.push(total_earnings);
    }

    if (is_transferable !== undefined) {
      updates.push(`is_transferable = $${paramIndex++}`);
      values.push(is_transferable);
    }

    if (staking_status !== undefined) {
      updates.push(`staking_status = $${paramIndex++}`);
      values.push(staking_status);
    }

    // 添加updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      // 只有updated_at，说明没有任何字段需要更新
      return NextResponse.json(
        { success: false, error: '没有提供需要更新的字段' },
        { status: 400 }
      );
    }

    // 添加node_id作为最后一个参数
    values.push(node_id);

    // 执行更新
    const updateSQL = `
      UPDATE nodes 
      SET ${updates.join(', ')}
      WHERE node_id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateSQL, values);
    const updatedNode = result[0];

    console.log('[API] 节点更新成功:', node_id);

    return NextResponse.json({
      success: true,
      message: '节点更新成功',
      data: {
        node_id: updatedNode.node_id,
        wallet_address: updatedNode.wallet_address,
        node_type: updatedNode.node_type,
        status: updatedNode.status,
        cpu_usage_percentage: parseFloat(updatedNode.cpu_usage_percentage || '0'),
        memory_usage_percentage: parseFloat(updatedNode.memory_usage_percentage || '0'),
        storage_used_percentage: parseFloat(updatedNode.storage_used_percentage || '0'),
        uptime_percentage: parseFloat(updatedNode.uptime_percentage || '0'),
        data_transferred_gb: parseFloat(updatedNode.data_transferred_gb || '0'),
        total_earnings: parseFloat(updatedNode.total_earnings || '0'),
        is_transferable: updatedNode.is_transferable,
        staking_status: updatedNode.staking_status,
        updated_at: updatedNode.updated_at
      }
    });

  } catch (error: any) {
    console.error('[API] 节点更新失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '更新失败' },
      { status: 500 }
    );
  }
}
