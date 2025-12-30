import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Starting team size calculation...');

    // 1. 获取所有会员及其上级关系 - 使用 wallets 表
    const walletsResult = await sql`
      SELECT wallet_address, parent_wallet
      FROM wallets
      WHERE wallet_address IS NOT NULL
    `;

    console.log(`Found ${walletsResult.length} wallets`);

    // 2. 构建团队关系图（parent -> children）
    const childrenMap: { [key: string]: string[] } = {};
    
    for (const wallet of walletsResult) {
      const walletAddr = wallet.wallet_address;
      const parent = wallet.parent_wallet;
      
      // 跳过无效的 parent
      if (parent && 
          parent !== '0x0000000000000000000000000000000000000001' &&
          parent.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
        const parentKey = parent.toLowerCase();
        
        if (!childrenMap[parentKey]) {
          childrenMap[parentKey] = [];
        }
        
        childrenMap[parentKey].push(walletAddr.toLowerCase());
      }
    }

    console.log(`Built children map for ${Object.keys(childrenMap).length} parents`);

    // 3. 递归计算团队人数
    function calculateTeamSize(walletAddress: string, visited = new Set<string>()): number {
      const key = walletAddress.toLowerCase();
      
      // 防止循环引用
      if (visited.has(key)) {
        return 0;
      }
      visited.add(key);
      
      const children = childrenMap[key] || [];
      
      if (children.length === 0) {
        return 0;
      }
      
      let total = children.length; // 直推人数
      
      // 递归计算所有下级的团队
      for (const child of children) {
        total += calculateTeamSize(child, visited);
      }
      
      return total;
    }

    // 4. 计算并更新每个钱包的 team_size
    const updates = [];
    let updatedCount = 0;
    
    for (const wallet of walletsResult) {
      const walletAddress = wallet.wallet_address;
      const teamSize = calculateTeamSize(walletAddress);
      
      // 更新数据库（包括 team_size 为 0 的情况）
      await sql`
        UPDATE wallets
        SET team_size = ${teamSize},
            updated_at = CURRENT_TIMESTAMP
        WHERE wallet_address = ${walletAddress}
      `;
      
      if (teamSize > 0) {
        updates.push({ 
          address: walletAddress,
          size: teamSize 
        });
      }
      updatedCount++;
    }

    console.log(`Updated ${updatedCount} wallets`);

    // 按团队人数排序
    updates.sort((a, b) => b.size - a.size);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} wallets with team sizes`,
      totalWallets: walletsResult.length,
      walletsWithTeam: updates.length,
      updates: updates
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
