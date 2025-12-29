export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await query(
      `SELECT 
        nl.id, nl.listing_id, nl.node_id, nl.seller_wallet, 
        nl.asking_price, nl.status, nl.description, nl.created_at,
        n.node_type, n.cpu_cores, n.memory_gb, n.storage_gb,
        n.total_earnings, n.uptime_percentage
      FROM node_listings nl
      LEFT JOIN nodes n ON nl.node_id = n.node_id
      WHERE nl.status = 'active'
      ORDER BY nl.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const listings = result.map((l: any) => ({
      listingId: l.listing_id,
      nodeId: l.node_id,
      sellerWallet: l.seller_wallet,
      price: parseFloat(l.asking_price || '0'),
      nodeType: l.node_type,
      specs: {
        cpu: l.cpu_cores,
        memory: l.memory_gb,
        storage: l.storage_gb
      },
      performance: {
        earnings: parseFloat(l.total_earnings || '0'),
        uptime: parseFloat(l.uptime_percentage || '0')
      },
      description: l.description,
      createdAt: l.created_at
    }));

    return NextResponse.json({
      success: true,
      data: { total: listings.length, listings }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
