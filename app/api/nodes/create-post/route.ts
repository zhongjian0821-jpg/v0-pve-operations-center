// app/api/nodes/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, nodeType, specs } = body;
    
    const nodeId = `${nodeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await query(`
      INSERT INTO nodes (node_id, wallet_address, node_type, status, cpu_cores, memory_gb, storage_gb, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [nodeId, walletAddress, nodeType, 'pending', specs?.cpu || 8, specs?.memory || 16, specs?.storage || 500]);
    
    return NextResponse.json({ success: true, data: { nodeId } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
