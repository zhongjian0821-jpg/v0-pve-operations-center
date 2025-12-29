// app/api/nodes/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('id');
    
    if (!nodeId) {
      return NextResponse.json({ success: false, error: '缺少节点ID' }, { status: 400 });
    }
    
    await query(`DELETE FROM nodes WHERE node_id = $1`, [nodeId]);
    return NextResponse.json({ success: true, message: '节点已删除' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
