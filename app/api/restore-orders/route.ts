export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const results: any = {};
    
    // 1. 查询所有 node_purchase 类型的佣金记录
    const commissions = await sql`
      SELECT 
        from_wallet,
        amount,
        commission_level,
        created_at
      FROM commission_records
      WHERE transaction_type = 'node_purchase'
      ORDER BY from_wallet, created_at
    `;
    
    results.found_commissions = commissions.length;
    
    // 2. 根据佣金推算购买金额并去重
    const purchases = [];
    const processedWallets = new Set();
    
    for (const comm of commissions) {
      if (processedWallets.has(comm.from_wallet)) continue;
      
      // level 1 佣金 12%, level 2 佣金 2%
      const purchaseAmount = comm.commission_level === 1 
        ? parseFloat(comm.amount) / 0.12 
        : parseFloat(comm.amount) / 0.02;
      
      purchases.push({
        wallet_address: comm.from_wallet,
        purchase_amount: purchaseAmount,
        created_at: comm.created_at
      });
      
      processedWallets.add(comm.from_wallet);
    }
    
    results.unique_purchases = purchases.length;
    
    // 3. 插入到 nodes 表
    const restoredNodes = [];
    
    for (const purchase of purchases) {
      const nodeId = `node_restored_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const inserted = await sql`
          INSERT INTO nodes (
            node_id,
            wallet_address,
            node_type,
            status,
            purchase_price,
            staking_amount,
            total_earnings,
            cpu_cores,
            memory_gb,
            storage_gb,
            is_transferable,
            created_at
          ) VALUES (
            ${nodeId},
            ${purchase.wallet_address},
            'cloud',
            'active',
            ${purchase.purchase_amount},
            0,
            0,
            8,
            16,
            500,
            true,
            ${purchase.created_at}
          )
          RETURNING *
        `;
        
        if (inserted.length > 0) {
          restoredNodes.push(inserted[0]);
        }
      } catch (e: any) {
        console.error('Insert error:', e.message);
      }
    }
    
    results.restored_count = restoredNodes.length;
    results.restored_nodes = restoredNodes;
    
    // 4. 查询总数
    const totalNodes = await sql`SELECT COUNT(*) as count FROM nodes`;
    results.total_nodes_now = parseInt(totalNodes[0].count);
    
    return successResponse({
      message: `成功恢复 ${restoredNodes.length} 个订单`,
      ...results
    });
    
  } catch (error: any) {
    console.error('Restore error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // 只查看可以恢复的订单
    const commissions = await sql`
      SELECT 
        from_wallet,
        amount,
        commission_level,
        created_at
      FROM commission_records
      WHERE transaction_type = 'node_purchase'
      ORDER BY created_at DESC
    `;
    
    const purchases = [];
    const processedWallets = new Set();
    
    for (const comm of commissions) {
      if (processedWallets.has(comm.from_wallet)) continue;
      
      const purchaseAmount = comm.commission_level === 1 
        ? parseFloat(comm.amount) / 0.12 
        : parseFloat(comm.amount) / 0.02;
      
      purchases.push({
        wallet_address: comm.from_wallet,
        estimated_purchase_amount: purchaseAmount.toFixed(2),
        commission_date: comm.created_at
      });
      
      processedWallets.add(comm.from_wallet);
    }
    
    return successResponse({
      message: `发现 ${purchases.length} 个可恢复的订单`,
      can_restore_count: purchases.length,
      purchases: purchases
    });
    
  } catch (error: any) {
    console.error('Check error:', error);
    return errorResponse(error.message, 500);
  }
}
