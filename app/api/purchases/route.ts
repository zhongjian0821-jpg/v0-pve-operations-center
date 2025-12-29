export const dynamic = 'force-dynamic';

import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        node_id, wallet_address, node_type, purchase_price,
        cpu_cores, memory_gb, storage_gb, status, tx_hash, created_at
      FROM nodes
      WHERE node_type IN ('cloud', 'image')
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (walletAddress) {
      sql += ` AND LOWER(wallet_address) = LOWER($${paramIndex++})`;
      params.push(walletAddress);
    }

    if (status) {
      if (status === 'completed') {
        sql += ` AND status IN ('active', 'running')`;
      } else if (status === 'pending') {
        sql += ` AND status IN ('pending', 'deploying')`;
      }
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    const purchases = result.map((p: any) => ({
      id: p.node_id,
      type: p.node_type,
      walletAddress: p.wallet_address,
      price: parseFloat(p.purchase_price || '0'),
      specs: {
        cpu: p.cpu_cores,
        memory: p.memory_gb,
        storage: p.storage_gb
      },
      status: p.status,
      txHash: p.tx_hash,
      purchaseDate: p.created_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        total: purchases.length,
        purchases: purchases
      }
    });

  } catch (error: any) {
    console.error('[API] 购买记录查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
