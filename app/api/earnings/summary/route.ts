// app/api/earnings/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: '缺少钱包地址' },
        { status: 400 }
      );
    }

    console.log('[API] 获取收益汇总:', address);

    // 并行查询多个数据源
    const [
      walletData,
      nodesData,
      assignedData,
      commissionsData
    ] = await Promise.all([
      // 1. 钱包收益汇总
      query(`
        SELECT 
          total_earnings,
          distributable_commission,
          distributed_commission,
          pending_withdrawal,
          total_withdrawn
        FROM wallets
        WHERE LOWER(wallet_address) = LOWER($1)
      `, [address]),
      
      // 2. 节点收益汇总
      query(`
        SELECT 
          COUNT(*) as node_count,
          COALESCE(SUM(total_earnings), 0) as total_node_earnings
        FROM nodes
        WHERE LOWER(wallet_address) = LOWER($1)
      `, [address]),
      
      // 3. 分配记录收益（最近30天）
      query(`
        SELECT 
          COALESCE(SUM(net_income_ashva), 0) as total_assigned_income,
          COUNT(DISTINCT device_id) as active_devices,
          MAX(record_date) as last_record_date
        FROM assigned_records
        WHERE LOWER(wallet_address) = LOWER($1)
          AND record_date >= CURRENT_DATE - INTERVAL '30 days'
      `, [address]),
      
      // 4. 佣金收益
      query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_commission,
          COUNT(*) as commission_count,
          MAX(created_at) as last_commission_date
        FROM commissions
        WHERE LOWER(wallet_address) = LOWER($1)
      `, [address])
    ]);

    // 处理钱包数据
    const wallet = walletData[0] || {
      total_earnings: 0,
      distributable_commission: 0,
      distributed_commission: 0,
      pending_withdrawal: 0,
      total_withdrawn: 0
    };

    const nodes = nodesData[0] || {
      node_count: 0,
      total_node_earnings: 0
    };

    const assigned = assignedData[0] || {
      total_assigned_income: 0,
      active_devices: 0,
      last_record_date: null
    };

    const commissions = commissionsData[0] || {
      total_commission: 0,
      commission_count: 0,
      last_commission_date: null
    };

    // 计算汇总数据
    const totalEarnings = parseFloat(wallet.total_earnings || '0');
    const nodeEarnings = parseFloat(nodes.total_node_earnings || '0');
    const assignedEarnings = parseFloat(assigned.total_assigned_income || '0');
    const commissionEarnings = parseFloat(commissions.total_commission || '0');
    
    const distributableCommission = parseFloat(wallet.distributable_commission || '0');
    const distributedCommission = parseFloat(wallet.distributed_commission || '0');
    const pendingWithdrawal = parseFloat(wallet.pending_withdrawal || '0');
    const totalWithdrawn = parseFloat(wallet.total_withdrawn || '0');

    // 可用余额 = 总收益 - 待提现 - 已提现
    const availableBalance = totalEarnings - pendingWithdrawal - totalWithdrawn;

    const response = {
      success: true,
      data: {
        // 总览
        summary: {
          totalEarnings: totalEarnings,
          totalEarningsFormatted: `${totalEarnings.toFixed(2)} ASHVA`,
          availableBalance: availableBalance,
          availableBalanceFormatted: `${availableBalance.toFixed(2)} ASHVA`,
          pendingWithdrawal: pendingWithdrawal,
          pendingWithdrawalFormatted: `${pendingWithdrawal.toFixed(2)} ASHVA`,
          totalWithdrawn: totalWithdrawn,
          totalWithdrawnFormatted: `${totalWithdrawn.toFixed(2)} ASHVA`
        },
        
        // 收益来源明细
        sources: {
          // 节点收益
          nodes: {
            total: nodeEarnings,
            totalFormatted: `${nodeEarnings.toFixed(2)} ASHVA`,
            nodeCount: parseInt(nodes.node_count || '0'),
            percentage: totalEarnings > 0 ? ((nodeEarnings / totalEarnings) * 100).toFixed(2) : '0'
          },
          
          // 分配记录收益（最近30天）
          assigned: {
            total: assignedEarnings,
            totalFormatted: `${assignedEarnings.toFixed(2)} ASHVA`,
            activeDevices: parseInt(assigned.active_devices || '0'),
            lastRecordDate: assigned.last_record_date,
            period: 'last_30_days'
          },
          
          // 佣金收益
          commissions: {
            total: commissionEarnings,
            totalFormatted: `${commissionEarnings.toFixed(2)} ASHVA`,
            count: parseInt(commissions.commission_count || '0'),
            lastCommissionDate: commissions.last_commission_date,
            distributable: distributableCommission,
            distributed: distributedCommission,
            percentage: totalEarnings > 0 ? ((commissionEarnings / totalEarnings) * 100).toFixed(2) : '0'
          }
        },
        
        // 提现信息
        withdrawal: {
          pending: pendingWithdrawal,
          pendingFormatted: `${pendingWithdrawal.toFixed(2)} ASHVA`,
          completed: totalWithdrawn,
          completedFormatted: `${totalWithdrawn.toFixed(2)} ASHVA`,
          available: availableBalance,
          availableFormatted: `${availableBalance.toFixed(2)} ASHVA`
        }
      }
    };

    console.log('[API] 收益汇总查询成功');
    
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[API] 收益汇总查询失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
