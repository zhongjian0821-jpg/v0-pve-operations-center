import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';
export async function GET(request: NextRequest) {
  try {
    const records = await sql`SELECT n.*, m.activation_code FROM bl_blockchain_nodes n LEFT JOIN bl_machines m ON n.machine_id=m.id ORDER BY n.created_at DESC`;
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
