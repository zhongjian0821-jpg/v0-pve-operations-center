// app/api/admin/blockchain/stats/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // 获取所有机器
    const machines = await sql`SELECT * FROM machines`;
    
    // 获取所有任务（注意：表名是 bl_blockchain_nodes）
    const tasks = await sql`SELECT * FROM bl_blockchain_nodes`;
    
    // 统计机器状态
    const machineStats = {
      total: machines.length,
      active: machines.filter((m: any) => m.status === 'active').length,
      inactive: machines.filter((m: any) => m.status === 'inactive').length,
      configured: machines.filter((m: any) => m.ip_address).length,
      unconfigured: machines.filter((m: any) => !m.ip_address).length,
    };
    
    // 统计任务状态
    const taskStats = {
      total: tasks.length,
      running: tasks.filter((t: any) => t.status === 'running').length,
      pending: tasks.filter((t: any) => t.status === 'pending').length,
      stopped: tasks.filter((t: any) => t.status === 'stopped').length,
      failed: tasks.filter((t: any) => t.status === 'failed').length,
    };
    
    // 按节点类型统计
    const nodeTypes = tasks.reduce((acc: Record<string, number>, task: any) => {
      const type = task.node_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // 计算待部署机器（没有配置或没有任务的机器）
    const pendingDeployment = machines.filter((m: any) => 
      !m.ip_address || !tasks.some((t: any) => t.machine_id === m.id)
    ).length;
    
    return NextResponse.json({
      success: true,
      data: {
        machines: machineStats,
        tasks: taskStats,
        nodeTypes,
        pendingDeployment,
        summary: {
          totalMachines: machineStats.total,
          totalTasks: taskStats.total,
          runningTasks: taskStats.running,
          pendingDeployment,
        }
      }
    });
    
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取统计数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
