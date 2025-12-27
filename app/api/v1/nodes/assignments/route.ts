import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    if (!wallet) return errorResponse('缺少wallet参数', 400);

    const assignments = await sql`
      SELECT 
        ar.node_id, ar.pve_node_id, ar.vm_id, ar.ip_address, ar.device_name,
        ar.online_status, ar.total_income, ar.daily_income, ar.assigned_at, ar.last_online_at,
        pa.product_type, pa.cpu_cores, pa.memory_gb, pa.storage_gb, pa.amount_ashva, pa.tx_hash
      FROM assigned_records ar
      JOIN pending_assignments pa ON pa.node_id = ar.node_id
      WHERE LOWER(pa.wallet_address) = LOWER(${wallet})
      ORDER BY ar.assigned_at DESC
    `;

    return successResponse(assignments);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
