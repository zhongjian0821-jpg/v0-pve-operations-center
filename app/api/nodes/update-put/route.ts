// app/api/nodes/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId, status, specs } = body;
    
    if (!nodeId) {
      return NextResponse.json({ success: false, error: '缺少节点ID' }, { status: 400 });
    }
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (specs) {
      if (specs.cpu) {
        updates.push(`cpu_cores = $${paramIndex++}`);
        params.push(specs.cpu);
      }
      if (specs.memory) {
        updates.push(`memory_gb = $${paramIndex++}`);
        params.push(specs.memory);
      }
    }
    
    updates.push(`updated_at = NOW()`);
    params.push(nodeId);
    
    await query(`UPDATE nodes SET ${updates.join(', ')} WHERE node_id = $${paramIndex}`, params);
    
    return NextResponse.json({ success: true, message: '节点已更新' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
