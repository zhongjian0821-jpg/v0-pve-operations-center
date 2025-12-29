import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    
    if (id) {
      const record = await sql`SELECT * FROM marketplace_listings WHERE id = ${id}`;
      return successResponse(record[0] || null);
    }
    
    let query = sql`SELECT * FROM marketplace_listings WHERE 1=1`;
    if (status) {
      query = sql`${query} AND status = ${status}`;
    }
    query = sql`${query} ORDER BY created_at DESC`;
    
    const records = await query;
    return successResponse({ records, total: records.length });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { seller_address, node_id, price, description, status = 'active' } = body;
    
    if (!seller_address || !node_id || !price) {
      return errorResponse('seller_address, node_id, and price are required', 400);
    }
    
    const result = await sql`
      INSERT INTO marketplace_listings (
        seller_address, node_id, price, description, status, created_at, updated_at
      ) VALUES (
        ${seller_address}, ${node_id}, ${price}, ${description}, ${status}, NOW(), NOW()
      ) RETURNING *
    `;
    return successResponse(result[0], 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

}

}
