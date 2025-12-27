import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const body = await request.json();
    const { nodeId, pveNodeId, vmId, ipAddress, deviceName } = body;

    const order = await sql`SELECT * FROM pending_assignments WHERE node_id = ${nodeId}`;
    if (order.length === 0) return errorResponse('订单不存在', 404);
    if (order[0].status === 'assigned') return errorResponse('订单已分配', 400);

    const assigned = await sql`
      INSERT INTO assigned_records (
        node_id, pve_node_id, vm_id, ip_address, device_name,
        online_status, total_income, daily_income,
        assigned_at, created_at, updated_at
      ) VALUES (
        ${nodeId}, ${pveNodeId}, ${vmId}, ${ipAddress}, ${deviceName},
        'online', 0, 0, NOW(), NOW(), NOW()
      ) RETURNING *
    `;

    await sql`
      UPDATE pending_assignments
      SET status = 'assigned', assigned_at = NOW(), assigned_by = ${admin.wallet_address}
      WHERE node_id = ${nodeId}
    `;

    return successResponse(assigned[0], '设备分配成功');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return errorResponse('未授权', 401);
    return errorResponse(error.message, 500);
  }
}
