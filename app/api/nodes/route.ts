import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({
        success: false,
        error: '缺少钱包地址参数'
      }, { status: 400 })
    }
    
    // 获取该钱包的所有节点
    const result = await sql`
      SELECT 
        node_id,
        node_type,
        status,
        cpu_cores,
        memory_gb,
        storage_gb,
        uptime_percentage,
        data_transferred_gb,
        total_earnings,
        cpu_usage_percentage,
        memory_usage_percentage,
        storage_used_percentage,
        created_at,
        is_transferable,
        purchase_price
      FROM nodes
      WHERE LOWER(wallet_address) = LOWER(${address})
      ORDER BY created_at DESC
    `
    
    const nodes = result.rows.map((node: any) => ({
      nodeId: node.node_id,
      nodeType: node.node_type,
      status: node.status,
      cpuCores: parseInt(node.cpu_cores || 0),
      memoryGb: parseFloat(node.memory_gb || 0),
      storageGb: parseFloat(node.storage_gb || 0),
      uptimePercentage: parseFloat(node.uptime_percentage || 0),
      dataTransferredGb: parseFloat(node.data_transferred_gb || 0),
      totalEarnings: parseFloat(node.total_earnings || 0),
      cpuUsagePercentage: parseFloat(node.cpu_usage_percentage || 0),
      memoryUsagePercentage: parseFloat(node.memory_usage_percentage || 0),
      storageUsedPercentage: parseFloat(node.storage_used_percentage || 0),
      isTransferable: node.is_transferable,
      purchasePrice: parseFloat(node.purchase_price || 0),
      createdAt: node.created_at
    }))
    
    // 统计
    const stats = {
      total: nodes.length,
      active: nodes.filter(n => n.status === 'active').length,
      inactive: nodes.filter(n => n.status === 'inactive').length,
      deploying: nodes.filter(n => n.status === 'deploying' || n.status === 'pending').length,
      totalEarnings: nodes.reduce((sum, n) => sum + n.totalEarnings, 0).toFixed(2)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        nodes,
        stats
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
    
  } catch (error: any) {
    console.error('Nodes API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
