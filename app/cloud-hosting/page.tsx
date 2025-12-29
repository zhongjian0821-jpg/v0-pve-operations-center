'use client'

import { useEffect, useState } from 'react'

interface Node {
  id: number
  name: string
  blockchain: string
  container_name?: string
  container_id?: string
  status: string
  machine_id?: string
  port?: number
  created_at: string
}

export default function CloudHostingPage() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [showDeployDialog, setShowDeployDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [logs, setLogs] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    blockchain: 'cosmos',
    machineId: '',
    port: 26657,
  })

  useEffect(() => {
    fetchNodes()
  }, [])

  async function fetchNodes() {
    try {
      const res = await fetch('/api/blockchain?endpoint=/api/admin/nodes/list')
      const data = await res.json()
      if (data.success) {
        setNodes(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch nodes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deployNode() {
    if (!formData.name || !formData.blockchain) {
      alert('请填写节点名称和区块链类型')
      return
    }

    setDeploying(true)
    try {
      const res = await fetch('/api/blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api/admin/nodes/deploy',
          ...formData
        })
      })
      
      const data = await res.json()
      if (data.success) {
        alert('节点部署成功')
        setShowDeployDialog(false)
        setFormData({ name: '', blockchain: 'cosmos', machineId: '', port: 26657 })
        fetchNodes()
      } else {
        alert('部署失败: ' + (data.error || ''))
      }
    } catch (error: any) {
      alert('错误: ' + error.message)
    } finally {
      setDeploying(false)
    }
  }

  async function startNode(node: Node) {
    try {
      const res = await fetch('/api/blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api/admin/nodes/start',
          nodeId: node.id
        })
      })
      
      const data = await res.json()
      if (data.success) {
        alert('节点启动成功')
        fetchNodes()
      } else {
        alert('启动失败: ' + (data.error || ''))
      }
    } catch (error: any) {
      alert('错误: ' + error.message)
    }
  }

  async function stopNode(node: Node) {
    try {
      const res = await fetch('/api/blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api/admin/nodes/stop',
          nodeId: node.id
        })
      })
      
      const data = await res.json()
      if (data.success) {
        alert('节点已停止')
        fetchNodes()
      } else {
        alert('停止失败: ' + (data.error || ''))
      }
    } catch (error: any) {
      alert('错误: ' + error.message)
    }
  }

  async function deleteNode(node: Node) {
    if (!confirm(`确定要删除节点 ${node.name} 吗？`)) return
    
    try {
      const res = await fetch('/api/blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api/admin/nodes/delete-node',
          nodeId: node.id
        })
      })
      
      const data = await res.json()
      if (data.success) {
        alert('节点已删除')
        fetchNodes()
      } else {
        alert('删除失败: ' + (data.error || ''))
      }
    } catch (error: any) {
      alert('错误: ' + error.message)
    }
  }

  async function viewLogs(node: Node) {
    setSelectedNode(node)
    setShowLogsDialog(true)
    setLogs('加载中...')
    
    try {
      const res = await fetch(`/api/blockchain?endpoint=/api/admin/nodes/logs&nodeId=${node.id}&lines=100`)
      const data = await res.json()
      if (data.success) {
        setLogs(data.data?.logs || '无日志')
      } else {
        setLogs('加载失败: ' + (data.error || ''))
      }
    } catch (error: any) {
      setLogs('错误: ' + error.message)
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      'running': 'bg-green-500',
      'pending': 'bg-yellow-500',
      'stopped': 'bg-gray-500',
      'deploying': 'bg-blue-500',
      'failed': 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* 页面标题 */}
      <div className="bg-white shadow-sm rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">区块链节点托管</h1>
          <p className="text-gray-600 mt-1">
            管理和部署区块链节点 ({nodes.length} 个节点)
          </p>
        </div>

        <button
          onClick={() => setShowDeployDialog(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + 部署节点
        </button>
      </div>

      {/* 节点列表 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">节点列表</h2>
        </div>
        
        {nodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无节点，点击“部署节点”创建第一个节点
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">节点名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">区块链</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">端口</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {nodes.map(node => (
                  <tr key={node.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{node.id}</td>
                    <td className="px-6 py-4 font-medium">{node.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded border">{node.blockchain}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded text-white ${getStatusColor(node.status)}`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{node.port || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(node.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {node.status !== 'running' && (
                          <button
                            onClick={() => startNode(node)}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                            title="启动"
                          >
                            ▶️
                          </button>
                        )}
                        {node.status === 'running' && (
                          <button
                            onClick={() => stopNode(node)}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                            title="停止"
                          >
                            ⏹️
                          </button>
                        )}
                        <button
                          onClick={() => viewLogs(node)}
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                          title="查看日志"
                        >
                          📄
                        </button>
                        <button
                          onClick={() => deleteNode(node)}
                          className="px-3 py-1 text-sm border rounded hover:bg-red-50 text-red-600"
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 部署对话框 */}
      {showDeployDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">部署新节点</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">节点名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="cosmos-mainnet-1"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">区块链类型</label>
                <select
                  value={formData.blockchain}
                  onChange={(e) => setFormData({...formData, blockchain: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="cosmos">Cosmos</option>
                  <option value="polygon">Polygon</option>
                  <option value="near">NEAR</option>
                  <option value="sui">Sui</option>
                  <option value="ethereum">Ethereum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">机器ID (可选)</label>
                <input
                  type="text"
                  value={formData.machineId}
                  onChange={(e) => setFormData({...formData, machineId: e.target.value})}
                  placeholder="machine-1"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">端口</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={deployNode}
                  disabled={deploying}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {deploying ? '部署中...' : '部署'}
                </button>
                <button
                  onClick={() => setShowDeployDialog(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 日志对话框 */}
      {showLogsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedNode?.name} - 节点日志</h3>
              <button
                onClick={() => setShowLogsDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto">
              <pre>{logs}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
