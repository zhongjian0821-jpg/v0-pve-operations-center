export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const results: any = {};
    
    // 1. 查询佣金记录
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
    
    // 2. 去重并计算购买金额
    const purchases = [];
    const processedWallets = new Set();
    
    for (const comm of commissions) {
      if (processedWallets.has(comm.from_wallet)) continue;
      
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
    
    // 3. 插入节点 - 添加所有必需字段！
    const restoredNodes = [];
    const errors = [];
    
    for (const purchase of purchases) {
      const nodeId = `node_restored_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const inserted = await sql`
          INSERT INTO nodes (
            node_id,
            wallet_address,
            node_type,
            node_category,
            status,
            purchase_price,
            staking_amount,
            total_earnings,
            cpu_cores,
            memory_gb,
            storage_gb,
            is_transferable,
            visible_to_owner,
            is_pool_node,
            deploy_progress,
            health_status,
            uptime_seconds,
            error_count,
            cpu_usage_percentage,
            memory_usage_percentage,
            storage_used_percentage,
            uptime_percentage,
            data_transferred_gb,
            staking_status,
            staking_required_usd,
            created_at,
            updated_at
          ) VALUES (
            ${nodeId},
            ${purchase.wallet_address},
            'cloud',
            'cloud',
            'active',
            ${purchase.purchase_amount},
            0,
            0,
            8,
            16,
            500,
            true,
            true,
            false,
            100,
            'healthy',
            0,
            0,
            0,
            0,
            0,
            99.9,
            0,
            'not_required',
            0,
            ${purchase.created_at},
            NOW()
          )
          RETURNING node_id, wallet_address, purchase_price, created_at
        `;
        
        if (inserted.length > 0) {
          restoredNodes.push(inserted[0]);
        }
      } catch (e: any) {
        errors.push({
          wallet: purchase.wallet_address,
          error: e.message
        });
      }
    }
    
    results.restored_count = restoredNodes.length;
    results.restored_nodes = restoredNodes;
    results.errors = errors;
    
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
