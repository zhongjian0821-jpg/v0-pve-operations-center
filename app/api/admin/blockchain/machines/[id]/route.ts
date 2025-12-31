import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET - 获取单个机器信息（包含SSH）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const machineId = params.id;
    
    const machines = await sql`
      SELECT 
        m.*,
        c.name as customer_name,
        c.wallet_address as customer_wallet
      FROM bl_machines m
      LEFT JOIN bl_customers c ON m.customer_id = c.id
      WHERE m.id = ${machineId}
    `;
    
    if (machines.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Machine not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: machines[0]
    });
    
  } catch (error: any) {
    console.error('Get machine error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT - 更新机器信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const machineId = params.id;
    const body = await request.json();
    
    const {
      machine_name,
      ip_address,
      gateway,
      subnet_mask,
      ssh_port,
      ssh_user,
      ssh_password,
      cpu_cores,
      memory_gb,
      storage_gb,
      node_id
    } = body;
    
    await sql`
      UPDATE bl_machines
      SET
        machine_name = COALESCE(${machine_name}, machine_name),
        ip_address = COALESCE(${ip_address}, ip_address),
        gateway = COALESCE(${gateway}, gateway),
        subnet_mask = COALESCE(${subnet_mask}, subnet_mask),
        ssh_port = COALESCE(${ssh_port}, ssh_port),
        ssh_user = COALESCE(${ssh_user}, ssh_user),
        ssh_password = COALESCE(${ssh_password}, ssh_password),
        cpu_cores = COALESCE(${cpu_cores}, cpu_cores),
        memory_gb = COALESCE(${memory_gb}, memory_gb),
        storage_gb = COALESCE(${storage_gb}, storage_gb),
        node_id = COALESCE(${node_id}, node_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${machineId}
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Machine updated successfully'
    });
    
  } catch (error: any) {
    console.error('Update machine error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
