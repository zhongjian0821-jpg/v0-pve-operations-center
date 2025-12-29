// app/api/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const maxDepth = parseInt(searchParams.get('depth') || '10');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    console.log('[API] 获取团队信息:', { address, maxDepth });

    // 1. 获取直推成员
    const directMembers = await query(`
      SELECT 
        wallet_address,
        ashva_balance,
        member_level,
        team_size,
        total_earnings,
        created_at
      FROM wallets
      WHERE LOWER(parent_wallet) = LOWER($1)
      ORDER BY created_at DESC
    `, [address]);

    console.log('[API] 直推成员:', directMembers.length);

    // 2. 从hierarchy表获取完整层级结构
    const hierarchyData = await query(`
      SELECT 
        h.wallet_address,
        h.level,
        w.ashva_balance,
        w.member_level,
        w.team_size,
        w.total_earnings,
        w.created_at
      FROM hierarchy h
      LEFT JOIN wallets w ON h.wallet_address = w.wallet_address
      WHERE LOWER(h.parent_wallet) = LOWER($1)
        AND h.level <= $2
      ORDER BY h.level, h.wallet_address
    `, [address, maxDepth]);

    console.log('[API] 层级成员:', hierarchyData.length);

    // 3. 统计各层级人数
    const levelStats: { [key: number]: number } = {};
    hierarchyData.forEach((member: any) => {
      const level = parseInt(member.level);
      levelStats[level] = (levelStats[level] || 0) + 1;
    });

    // 4. 计算团队总业绩
    const totalTeamEarnings = hierarchyData.reduce((sum: number, member: any) => {
      return sum + parseFloat(member.total_earnings || '0');
    }, 0);

    const totalTeamBalance = hierarchyData.reduce((sum: number, member: any) => {
      return sum + parseFloat(member.ashva_balance || '0');
    }, 0);

    // 5. 获取会员等级分布
    const levelDistribution: { [key: string]: number } = {};
    hierarchyData.forEach((member: any) => {
      const level = member.member_level || 'normal';
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
    });

    // 6. 格式化直推成员数据
    const formattedDirectMembers = directMembers.map((member: any) => ({
      walletAddress: member.wallet_address,
      ashvaBalance: parseFloat(member.ashva_balance || '0'),
      memberLevel: member.member_level,
      teamSize: parseInt(member.team_size || '0'),
      totalEarnings: parseFloat(member.total_earnings || '0'),
      joinDate: member.created_at
    }));

    // 7. 按层级分组
    const membersByLevel: { [key: number]: any[] } = {};
    hierarchyData.forEach((member: any) => {
      const level = parseInt(member.level);
      if (!membersByLevel[level]) {
        membersByLevel[level] = [];
      }
      
      membersByLevel[level].push({
        walletAddress: member.wallet_address,
        level: level,
        ashvaBalance: parseFloat(member.ashva_balance || '0'),
        memberLevel: member.member_level,
        teamSize: parseInt(member.team_size || '0'),
        totalEarnings: parseFloat(member.total_earnings || '0'),
        joinDate: member.created_at
      });
    });

    // 8. 获取当前用户的上级
    const uplineData = await query(`
      SELECT parent_wallet
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER($1)
    `, [address]);

    const uplineAddress = uplineData[0]?.parent_wallet || null;

    const response = {
      success: true,
      data: {
        // 基础统计
        stats: {
          totalMembers: hierarchyData.length,
          directMembers: directMembers.length,
          totalLevels: Object.keys(levelStats).length,
          maxDepth: maxDepth,
          totalTeamEarnings: totalTeamEarnings,
          totalTeamEarningsFormatted: `${totalTeamEarnings.toFixed(2)} ASHVA`,
          totalTeamBalance: totalTeamBalance,
          totalTeamBalanceFormatted: `${totalTeamBalance.toFixed(2)} ASHVA`
        },
        
        // 上级信息
        upline: {
          address: uplineAddress,
          hasUpline: uplineAddress !== null
        },
        
        // 各层级统计
        levelStats: levelStats,
        
        // 会员等级分布
        levelDistribution: levelDistribution,
        
        // 直推成员列表
        directMembers: formattedDirectMembers,
        
        // 按层级分组的成员
        membersByLevel: membersByLevel,
        
        // 最近加入的成员（前10名）
        recentMembers: hierarchyData
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map((member: any) => ({
            walletAddress: member.wallet_address,
            level: parseInt(member.level),
            memberLevel: member.member_level,
            joinDate: member.created_at
          }))
      }
    };

    console.log('[API] 团队信息查询成功');
    
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[API] 团队信息查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
