import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';
export async function GET(request: NextRequest) {
  try {
    const records = await sql`SELECT m.*, c.name as customer_name FROM bl_machines m LEFT JOIN bl_customers c ON m.customer_id=c.id ORDER BY m.created_at DESC`;
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
