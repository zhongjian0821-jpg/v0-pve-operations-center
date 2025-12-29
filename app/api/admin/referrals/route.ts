import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // 获取推荐关系数据（使用递归CTE）
    const referralsQuery = `
      WITH RECURSIVE referral_tree AS (
        SELECT wallet_address, parent_wallet, member_level, team_size, 
               total_earnings, created_at, 1 as level
        FROM wallets
        WHERE parent_wallet IS NULL OR parent_wallet = ''
        UNION ALL
        SELECT w.wallet_address, w.parent_wallet, w.member_level, w.team_size,
               w.total_earnings, w.created_at, rt.level + 1
        FROM wallets w
        INNER JOIN referral_tree rt ON w.parent_wallet = rt.wallet_address
      )
      SELECT * FROM referral_tree
      ORDER BY level, created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const referrals = await query(referralsQuery, [limit, offset]);
    const countResult = await query('SELECT COUNT(*) as total FROM wallets');
    
    return NextResponse.json({
      success: true,
      data: {
        referrals: referrals.rows,
        pagination: {
          page, limit,
          total: parseInt(countResult.rows[0]?.total || '0')
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}