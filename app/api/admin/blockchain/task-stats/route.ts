import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 1. 总任务统计
    const totalTasks = await sql`
      SELECT COUNT(*) as total FROM bl_blockchain_nodes
    `;
    
    const runningTasks = await sql`
      SELECT COUNT(*) as count FROM bl_blockchain_nodes WHERE status = 'running'
    `;
    
    const stoppedTasks = await sql`
      SELECT COUNT(*) as count FROM bl_blockchain_nodes WHERE status = 'stopped'
    `;
    
    const deployingTasks = await sql`
      SELECT COUNT(*) as count FROM bl_blockchain_nodes WHERE status = 'deploying'
    `;
    
    // 2. 今日收益统计
    const todayEarnings = await sql`
      SELECT 
        COALESCE(SUM(earnings_amount), 0) as total
      FROM task_hourly_earnings
      WHERE DATE(hour_start) = CURRENT_DATE
    `;
    
    // 3. 本小时收益统计
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);
    
    const hourlyEarnings = await sql`
      SELECT 
        COALESCE(SUM(earnings_amount), 0) as total
      FROM task_hourly_earnings
      WHERE hour_start >= ${currentHour.toISOString()}
    `;
    
    // 4. 机器任务分布
    const machineStats = await sql`
      SELECT 
        m.id as machine_id,
        m.machine_name,
        m.ip_address,
        m.cpu_cores,
        m.memory_gb,
        m.storage_gb,
        COUNT(t.id) as task_count,
        COALESCE(SUM(t.daily_earnings), 0) as total_daily_earnings
      FROM bl_machines m
      LEFT JOIN bl_blockchain_nodes t ON m.id = t.machine_id
      WHERE m.status = 'active'
      GROUP BY m.id, m.machine_name, m.ip_address, m.cpu_cores, m.memory_gb, m.storage_gb
      ORDER BY task_count DESC
    `;
    
    // 5. 节点类型分布
    const nodeTypeStats = await sql`
      SELECT 
        node_type,
        COUNT(*) as count,
        COALESCE(SUM(daily_earnings), 0) as total_daily_earnings
      FROM bl_blockchain_nodes
      WHERE status = 'running'
      GROUP BY node_type
      ORDER BY count DESC
    `;
    
    // 6. 总收益
    const totalEarnings = await sql`
      SELECT 
        COALESCE(SUM(total_earnings), 0) as total
      FROM bl_blockchain_nodes
    `;
    
    // 7. 平均收益
    const avgEarnings = await sql`
      SELECT 
        COALESCE(AVG(daily_earnings), 0) as avg_daily,
        COALESCE(AVG(hourly_earnings), 0) as avg_hourly
      FROM bl_blockchain_nodes
      WHERE status = 'running'
    `;
    
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_tasks: parseInt(totalTasks[0].total),
          running_tasks: parseInt(runningTasks[0].count),
          stopped_tasks: parseInt(stoppedTasks[0].count),
          deploying_tasks: parseInt(deployingTasks[0].count),
        },
        earnings: {
          today: parseFloat(todayEarnings[0].total),
          this_hour: parseFloat(hourlyEarnings[0].total),
          total: parseFloat(totalEarnings[0].total),
          avg_daily: parseFloat(avgEarnings[0].avg_daily),
          avg_hourly: parseFloat(avgEarnings[0].avg_hourly),
        },
        machine_distribution: machineStats.map((m: any) => ({
          machine_id: m.machine_id,
          machine_name: m.machine_name,
          ip_address: m.ip_address,
          specs: {
            cpu: m.cpu_cores,
            memory: m.memory_gb,
            storage: m.storage_gb,
          },
          task_count: parseInt(m.task_count),
          daily_earnings: parseFloat(m.total_daily_earnings),
        })),
        node_type_distribution: nodeTypeStats.map((n: any) => ({
          type: n.node_type,
          count: parseInt(n.count),
          daily_earnings: parseFloat(n.total_daily_earnings),
        })),
      }
    });
    
  } catch (error: any) {
    console.error('Get stats error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
