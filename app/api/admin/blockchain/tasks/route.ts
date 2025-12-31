import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET - 获取任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const nodeId = searchParams.get('node_id');
    const machineId = searchParams.get('machine_id');
    
    let query = `
      SELECT 
        t.*,
        m.machine_name,
        m.ip_address,
        m.cpu_cores,
        m.memory_gb,
        m.storage_gb
      FROM bl_blockchain_nodes t
      LEFT JOIN bl_machines m ON t.machine_id = m.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (nodeId) {
      query += ` AND t.node_id = $${params.length + 1}`;
      params.push(nodeId);
    }
    
    if (machineId) {
      query += ` AND t.machine_id = $${params.length + 1}`;
      params.push(machineId);
    }
    
    query += ` ORDER BY t.created_at DESC`;
    
    const tasks = await sql.unsafe(query, params);
    
    return NextResponse.json({
      success: true,
      data: tasks,
      count: tasks.length
    });
    
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - 创建新任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      node_id,
      machine_id,
      node_type,
      task_name,
      container_id,
      container_name,
      wallet_address,
      status,
      daily_earnings,
      hourly_earnings,
      config,
      deployed_by
    } = body;
    
    const result = await sql`
      INSERT INTO bl_blockchain_nodes (
        node_id,
        machine_id,
        node_type,
        task_name,
        container_id,
        container_name,
        wallet_address,
        status,
        daily_earnings,
        hourly_earnings,
        total_earnings,
        config,
        deployed_by,
        deployed_at,
        created_at
      ) VALUES (
        ${node_id},
        ${machine_id},
        ${node_type},
        ${task_name},
        ${container_id},
        ${container_name},
        ${wallet_address},
        ${status || 'running'},
        ${daily_earnings || 0},
        ${hourly_earnings || 0},
        0,
        ${config},
        ${deployed_by || 'admin'},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;
    
    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Task created successfully'
    });
    
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT - 更新任务
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, daily_earnings, hourly_earnings, total_earnings, uptime_hours } = body;
    
    await sql`
      UPDATE bl_blockchain_nodes
      SET
        status = COALESCE(${status}, status),
        daily_earnings = COALESCE(${daily_earnings}, daily_earnings),
        hourly_earnings = COALESCE(${hourly_earnings}, hourly_earnings),
        total_earnings = COALESCE(${total_earnings}, total_earnings),
        uptime_hours = COALESCE(${uptime_hours}, uptime_hours),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Task updated successfully'
    });
    
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
