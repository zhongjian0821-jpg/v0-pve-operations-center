import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const records = await sql`SELECT * FROM marketplace_transactions ORDER BY created_at DESC`;
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
