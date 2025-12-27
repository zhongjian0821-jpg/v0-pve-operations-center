import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    if (!wallet) return errorResponse('缺少wallet参数', 400);

    const commissions = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM commission_records
      WHERE LOWER(wallet_address) = LOWER(${wallet})
    `;

    const nodeEarnings = await sql`
      SELECT COALESCE(SUM(ar.total_income), 0) as total
      FROM assigned_records ar
      JOIN pending_assignments pa ON pa.node_id = ar.node_id
      WHERE LOWER(pa.wallet_address) = LOWER(${wallet})
    `;

    const teamRewards = Number(commissions[0]?.total || 0);
    const nodeIncome = Number(nodeEarnings[0]?.total || 0);
    const totalEarnings = teamRewards + nodeIncome;

    return successResponse({
      total_earnings: totalEarnings,
      team_rewards: { amount: teamRewards, percentage: totalEarnings > 0 ? (teamRewards / totalEarnings * 100).toFixed(2) : 0 },
      node_earnings: { amount: nodeIncome, percentage: totalEarnings > 0 ? (nodeIncome / totalEarnings * 100).toFixed(2) : 0 }
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
