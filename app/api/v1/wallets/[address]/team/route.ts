import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest, { params }: { params: { address: string } }) {
  try {
    const { address } = params;

    const directTeam = await sql`
      SELECT w.wallet_address, w.member_level, w.ashva_balance, w.team_size, w.total_earnings, w.created_at as joined_at
      FROM wallets w
      WHERE LOWER(w.parent_wallet) = LOWER(${address})
      ORDER BY w.created_at DESC
    `;

    const teamStats = await sql`
      WITH RECURSIVE team AS (
        SELECT wallet_address, parent_wallet, 1 as level
        FROM hierarchy
        WHERE LOWER(parent_wallet) = LOWER(${address})
        UNION ALL
        SELECT h.wallet_address, h.parent_wallet, t.level + 1
        FROM hierarchy h
        JOIN team t ON LOWER(h.parent_wallet) = LOWER(t.wallet_address)
        WHERE t.level < 10
      )
      SELECT level, COUNT(*) as count, COALESCE(SUM(w.ashva_balance), 0) as total_value
      FROM team t
      JOIN wallets w ON LOWER(w.wallet_address) = LOWER(t.wallet_address)
      GROUP BY level
      ORDER BY level
    `;

    const totalTeam = teamStats.reduce((sum: number, level: any) => sum + Number(level.count), 0);

    return successResponse({ direct_team: directTeam, total_team: totalTeam, team_levels: teamStats });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
