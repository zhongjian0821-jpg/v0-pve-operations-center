import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. 获取所有层级关系
    const hierarchyResult = await sql`
      SELECT wallet_address, parent_wallet
      FROM member_hierarchy
      WHERE parent_wallet IS NOT NULL
    `;

    // 2. 构建团队关系图
    const childrenMap: { [key: string]: string[] } = {};
    
    for (const row of hierarchyResult) {
      const parent = row.parent_wallet.toLowerCase();
      const child = row.wallet_address.toLowerCase();
      
      if (!childrenMap[parent]) {
        childrenMap[parent] = [];
      }
      childrenMap[parent].push(child);
    }

    // 3. 递归计算每个人的团队人数
    function calculateTeamSize(walletAddress: string): number {
      const children = childrenMap[walletAddress.toLowerCase()] || [];
      
      if (children.length === 0) {
        return 0;
      }
      
      let total = children.length; // 直推人数
      
      // 加上所有下级的团队人数
      for (const child of children) {
        total += calculateTeamSize(child);
      }
      
      return total;
    }

    // 4. 获取所有会员
    const membersResult = await sql`
      SELECT wallet_address FROM members
    `;

    // 5. 计算并更新每个会员的 team_size
    const updates = [];
    
    for (const member of membersResult) {
      const walletAddress = member.wallet_address;
      const teamSize = calculateTeamSize(walletAddress);
      
      if (teamSize > 0) {
        updates.push({ address: walletAddress, size: teamSize });
        
        // 更新数据库
        await sql`
          UPDATE members
          SET team_size = ${teamSize}
          WHERE wallet_address = ${walletAddress}
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} members with team sizes`,
      updates: updates
    });

  } catch (error) {
    console.error('Calculate team size error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate team sizes' },
      { status: 500 }
    );
  }
}
