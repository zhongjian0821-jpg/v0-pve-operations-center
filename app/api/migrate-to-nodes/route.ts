export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const results: any = {
      step1_commission_records: null,
      step2_assigned_records: null,
      step3_wallets_with_earnings: null,
      step4_migration_summary: null
    };
    
    // ==========================================
    // 步骤 1: 从 commission_records 迁移
    // ==========================================
    
    // 查询所有 node_purchase 佣金记录
    const commissions = await sql`
      SELECT 
        from_wallet,
        amount,
        commission_level,
        created_at,
        id
      FROM commission_records
      WHERE transaction_type = 'node_purchase'
      ORDER BY from_wallet, created_at
    `;
    
    results.step1_commission_records = {
      found: commissions.length,
      details: []
    };
    
    // 按钱包地址分组，每个钱包创建一个节点
    const walletPurchases = new Map();
    
    for (const comm of commissions) {
      const wallet = comm.from_wallet.toLowerCase();
      
      if (!walletPurchases.has(wallet)) {
        // 计算购买金额
        const purchaseAmount = comm.commission_level === 1 
          ? parseFloat(comm.amount) / 0.12 
          : parseFloat(comm.amount) / 0.02;
        
        walletPurchases.set(wallet, {
          wallet_address: comm.from_wallet,
          purchase_amount: purchaseAmount,
          created_at: comm.created_at,
          commission_records: []
        });
      }
      
      walletPurchases.get(wallet).commission_records.push({
        id: comm.id,
        amount: comm.amount,
        level: comm.commission_level
      });
    }
    
    results.step1_commission_records.unique_wallets = walletPurchases.size;
    
    // ==========================================
    // 步骤 2: 从 assigned_records 获取收益数据
    // ==========================================
    
    const assignedRecords = await sql`
      SELECT 
        wallet_address,
        SUM(net_income_ashva) as total_income,
        COUNT(*) as record_count
      FROM assigned_records
      GROUP BY wallet_address
    `;
    
    results.step2_assigned_records = {
      found: assignedRecords.length,
      data: assignedRecords
    };
    
    // 将收益数据关联到购买记录
    for (const record of assignedRecords) {
      const wallet = record.wallet_address.toLowerCase();
      if (walletPurchases.has(wallet)) {
        walletPurchases.get(wallet).total_earnings = parseFloat(record.total_income);
      }
    }
    
    // ==========================================
    // 步骤 3: 从 wallets 表获取收益数据
    // ==========================================
    
    const walletsWithEarnings = await sql`
      SELECT 
        wallet_address,
        total_earnings,
        distributable_commission
      FROM wallets
      WHERE total_earnings > 0 OR distributable_commission > 0
    `;
    
    results.step3_wallets_with_earnings = {
      found: walletsWithEarnings.length,
      data: walletsWithEarnings
    };
    
    // 合并 wallets 表的收益数据
    for (const wallet of walletsWithEarnings) {
      const addr = wallet.wallet_address.toLowerCase();
      if (walletPurchases.has(addr)) {
        const existing = walletPurchases.get(addr).total_earnings || 0;
        const walletEarnings = parseFloat(wallet.total_earnings) || 0;
        walletPurchases.get(addr).total_earnings = Math.max(existing, walletEarnings);
      }
    }
    
    // ==========================================
    // 步骤 4: 批量插入到 nodes 表
    // ==========================================
    
    const migratedNodes = [];
    const skippedWallets = [];
    const errors = [];
    
    // 先检查哪些钱包已经有 nodes 记录
    const existingNodes = await sql`
      SELECT DISTINCT LOWER(wallet_address) as wallet_address 
      FROM nodes
    `;
    
    const existingWallets = new Set(existingNodes.map(n => n.wallet_address));
    
    for (const [wallet, data] of walletPurchases.entries()) {
      // 跳过已经有节点的钱包
      if (existingWallets.has(wallet)) {
        skippedWallets.push({
          wallet: data.wallet_address,
          reason: 'Already has nodes record'
        });
        continue;
      }
      
      const nodeId = `node_migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
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
            ${data.wallet_address},
            'cloud',
            'cloud',
            'active',
            ${data.purchase_amount},
            0,
            ${data.total_earnings || 0},
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
            ${data.created_at},
            NOW()
          )
          RETURNING node_id, wallet_address, purchase_price, total_earnings, created_at
        `;
        
        if (inserted.length > 0) {
          migratedNodes.push({
            ...inserted[0],
            source: 'commission_records'
          });
        }
      } catch (e: any) {
        errors.push({
          wallet: data.wallet_address,
          error: e.message
        });
      }
    }
    
    // 查询最终的 nodes 表总数
    const totalNodes = await sql`SELECT COUNT(*) as count FROM nodes`;
    
    results.step4_migration_summary = {
      total_purchases_found: walletPurchases.size,
      successfully_migrated: migratedNodes.length,
      skipped_existing: skippedWallets.length,
      errors: errors.length,
      migrated_nodes: migratedNodes,
      skipped_wallets: skippedWallets,
      error_details: errors,
      total_nodes_now: parseInt(totalNodes[0].count)
    };
    
    return successResponse({
      message: `数据迁移完成！成功迁移 ${migratedNodes.length} 个节点`,
      ...results
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // 预览模式：显示将要迁移的数据，不实际迁移
    
    // 1. commission_records
    const commissions = await sql`
      SELECT 
        from_wallet,
        COUNT(*) as commission_count,
        MAX(created_at) as last_purchase_date
      FROM commission_records
      WHERE transaction_type = 'node_purchase'
      GROUP BY from_wallet
      ORDER BY last_purchase_date DESC
    `;
    
    // 2. assigned_records
    const assigned = await sql`
      SELECT 
        wallet_address,
        SUM(net_income_ashva) as total_earnings,
        COUNT(*) as record_count
      FROM assigned_records
      GROUP BY wallet_address
    `;
    
    // 3. 已存在的 nodes
    const existingNodes = await sql`
      SELECT 
        wallet_address,
        COUNT(*) as node_count
      FROM nodes
      GROUP BY wallet_address
    `;
    
    // 4. 计算将要迁移的数量
    const existingWallets = new Set(existingNodes.map(n => n.wallet_address.toLowerCase()));
    const toMigrate = commissions.filter(c => !existingWallets.has(c.from_wallet.toLowerCase()));
    
    return successResponse({
      message: `预览：发现 ${toMigrate.length} 个钱包需要迁移`,
      will_migrate: toMigrate.length,
      already_exists: existingWallets.size,
      preview_data: {
        commission_records: commissions,
        assigned_records: assigned,
        existing_nodes: existingNodes,
        to_migrate: toMigrate
      }
    });
    
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
