import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';
export async function GET(request: NextRequest) {
  try {
    const records = await sql`SELECT * FROM cloud_node_purchases ORDER BY created_at DESC`;
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
