"use client"

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Square, 
  Trash2, 
  FileText, 
  Plus,
  Loader2,
  Cloud,
  Server
} from 'lucide-react'
import { toast } from 'sonner'

interface Node {
  id: number
  name: string
  blockchain: string
  container_name?: string
  container_id?: string
  status: string
  machine_id?: string
  port?: number
  node_type?: string
  created_at: string
}

export default function CloudHostingPage() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [deployDialogOpen, setDeployDialogOpen] = useState(false)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [logs, setLogs] = useState('')
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    blockchain: 'cosmos',
    machineId: '',
    port: 26657,
  })

  // 加载节点列表
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

  // 部署节点
  async function deployNode() {
    if (!formData.name || !formData.blockchain) {
      toast.error('请填写节点名称和区块链类型')
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
        toast.success('节点部署成功')
        setDeployDialogOpen(false)
        setFormData({ name: '', blockchain: 'cosmos', machineId: '', port: 26657 })
        fetchNodes()
      } else {
        toast.error(data.error || '部署失败')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setDeploying(false)
    }
  }

  // 启动节点
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
        toast.success('节点启动成功')
        fetchNodes()
      } else {
        toast.error(data.error || '启动失败')
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // 停止节点
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
        toast.success('节点已停止')
        fetchNodes()
      } else {
        toast.error(data.error || '停止失败')
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // 删除节点
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
        toast.success('节点已删除')
        fetchNodes()
      } else {
        toast.error(data.error || '删除失败')
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // 查看日志
  async function viewLogs(node: Node) {
    setSelectedNode(node)
    setLogsDialogOpen(true)
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

  // 状态徽章颜色
  function getStatusBadge(status: string) {
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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cloud className="h-8 w-8" />
            区块链节点托管
          </h1>
          <p className="text-gray-600 mt-1">
            管理和部署区块链节点 ({nodes.length} 个节点)
          </p>
        </div>

        {/* 部署按钮 */}
        <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              部署节点
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>部署新节点</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>节点名称</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="cosmos-mainnet-1"
                />
              </div>
              
              <div>
                <Label>区块链类型</Label>
                <Select value={formData.blockchain} onValueChange={(v) => setFormData({...formData, blockchain: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cosmos">Cosmos</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="near">NEAR</SelectItem>
                    <SelectItem value="sui">Sui</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>机器ID (可选)</Label>
                <Input 
                  value={formData.machineId}
                  onChange={(e) => setFormData({...formData, machineId: e.target.value})}
                  placeholder="machine-1"
                />
              </div>

              <div>
                <Label>端口</Label>
                <Input 
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                />
              </div>

              <Button 
                onClick={deployNode} 
                disabled={deploying}
                className="w-full"
              >
                {deploying ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 部署中...</>
                ) : (
                  <>部署</ >
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 节点列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            节点列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              暂无节点，点击“部署节点”创建第一个节点
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">节点名称</th>
                    <th className="text-left p-2">区块链</th>
                    <th className="text-left p-2">状态</th>
                    <th className="text-left p-2">端口</th>
                    <th className="text-left p-2">创建时间</th>
                    <th className="text-right p-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map(node => (
                    <tr key={node.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{node.id}</td>
                      <td className="p-2 font-medium">{node.name}</td>
                      <td className="p-2">
                        <Badge variant="outline">{node.blockchain}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusBadge(node.status)}>
                          {node.status}
                        </Badge>
                      </td>
                      <td className="p-2">{node.port || '-'}</td>
                      <td className="p-2">
                        {new Date(node.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="p-2">
                        <div className="flex justify-end gap-2">
                          {node.status !== 'running' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startNode(node)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {node.status === 'running' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => stopNode(node)}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => viewLogs(node)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteNode(node)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 日志对话框 */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedNode?.name} - 节点日志
            </DialogTitle>
          </DialogHeader>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
            <pre>{logs}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
