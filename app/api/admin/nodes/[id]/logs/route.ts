import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
const N8N_BASE_URL = 'http://108.165.176.77:8081'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const lines = searchParams.get('lines') || '100'
    const id = parseInt(params.id)

    // 获取节点信息
    const nodes = await sql`
      SELECT n.*, m.ip_address, m.machine_id
      FROM nodes n
      LEFT JOIN machines m ON n.machine_id = m.id
      WHERE n.id = ${id}
    `

    if (nodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      )
    }

    const node = nodes[0]

    // 如果没有 IP 地址，返回错误
    if (!node.ip_address) {
      return NextResponse.json(
        { success: false, error: 'Machine IP address not available' },
        { status: 400 }
      )
    }

    try {
      // 调用 n8n 获取日志
      const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook/get-node-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_ip: node.ip_address,
          node_id: node.node_id,
          container_name: node.container_name || `${node.blockchain}_${node.node_id}`,
          lines: parseInt(lines)
        }),
        signal: AbortSignal.timeout(30000) // 30秒超时
      })

      let logs = ''
      if (n8nResponse.ok) {
        logs = await n8nResponse.text()
      } else {
        logs = `⚠️ 无法获取日志 (HTTP ${n8nResponse.status})\n\n可能原因:\n1. n8n webhook 未创建\n2. 机器无法访问\n3. 容器不存在`
      }

      return NextResponse.json({
        success: true,
        logs: logs,
        node_id: node.node_id,
        container_name: node.container_name || `${node.blockchain}_${node.node_id}`,
        machine_id: node.machine_id,
        ip_address: node.ip_address,
        lines: parseInt(lines)
      })

    } catch (n8nError: any) {
      console.error('n8n request error:', n8nError)
      
      // n8n 调用失败，返回模拟日志
      const mockLogs = `⚠️ 无法连接到 n8n 服务器\n\n节点信息:\n- 节点ID: ${node.node_id}\n- 容器名: ${node.container_name || 'N/A'}\n- 机器IP: ${node.ip_address}\n- 区块链: ${node.blockchain}\n\n说明:\n这是因为 n8n webhook 还未创建或不可用。\n请在 n8n 中创建 /webhook/get-node-logs 端点。\n\n创建后，此 API 将能够获取实际的容器日志。`

      return NextResponse.json({
        success: true,
        logs: mockLogs,
        node_id: node.node_id,
        container_name: node.container_name || `${node.blockchain}_${node.node_id}`,
        machine_id: node.machine_id,
        ip_address: node.ip_address,
        warning: 'n8n webhook not available',
        lines: parseInt(lines)
      })
    }

  } catch (error: any) {
    console.error('Get node logs error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
