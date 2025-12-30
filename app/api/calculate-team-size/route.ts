import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Starting team size calculation...');

    // 1. 获取所有会员及其上级关系
    const membersResult = await sql`
      SELECT wallet_address, parent_wallet
      FROM members
      WHERE wallet_address IS NOT NULL
    `;

    console.log(`Found ${membersResult.length} members`);

    // 2. 构建团队关系图（parent -> children）
    const childrenMap: { [key: string]: string[] } = {};
    
    for (const member of membersResult) {
      const wallet = member.wallet_address;
      const parent = member.parent_wallet;
      
      if (parent && parent !== '0x0000000000000000000000000000000000000001') {
        const parentKey = parent.toLowerCase();
        
        if (!childrenMap[parentKey]) {
          childrenMap[parentKey] = [];
        }
        
        childrenMap[parentKey].push(wallet.toLowerCase());
      }
    }

    console.log(`Built children map for ${Object.keys(childrenMap).length} parents`);

    // 3. 递归计算团队人数
    function calculateTeamSize(walletAddress: string): number {
      const key = walletAddress.toLowerCase();
      const children = childrenMap[key] || [];
      
      if (children.length === 0) {
        return 0;
      }
      
      let total = children.length; // 直推人数
      
      // 递归计算所有下级的团队
      for (const child of children) {
        total += calculateTeamSize(child);
      }
      
      return total;
    }

    // 4. 计算并更新每个会员的 team_size
    const updates = [];
    let updatedCount = 0;
    
    for (const member of membersResult) {
      const walletAddress = member.wallet_address;
      const teamSize = calculateTeamSize(walletAddress);
      
      if (teamSize > 0) {
        // 更新数据库
        await sql`
          UPDATE members
          SET team_size = ${teamSize},
              updated_at = CURRENT_TIMESTAMP
          WHERE wallet_address = ${walletAddress}
        `;
        
        updates.push({ 
          address: walletAddress,
          size: teamSize 
        });
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} members`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} members with team sizes`,
      totalMembers: membersResult.length,
      updatedMembers: updatedCount,
      updates: updates.sort((a, b) => b.size - a.size) // 按团队人数排序
    });

  } catch (error: any) {
    console.error('Calculate team size error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate team sizes',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
