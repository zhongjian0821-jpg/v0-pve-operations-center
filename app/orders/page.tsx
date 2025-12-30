'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Server, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react'

interface Order {
  id: number
  node_id: string
  wallet_address: string
  node_type: string
  order_type: 'hosting' | 'image'
  order_description: string
  status: string
  purchase_price: string
  total_earnings: string
  cpu_cores: number
  memory_gb: number
  storage_gb: number
  member_level: string
  created_at: string
}

interface Stats {
  total: number
  hosting: number
  image: number
  by_status: {
    pending: number
    active: number
    inactive: number
    deploying: number
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'hosting' | 'image'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
  }, [filter, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      let url = '/api/orders?'
      if (filter !== 'all') {
        url += `type=${filter}&`
      }
      if (statusFilter !== 'all') {
        url += `status=${statusFilter}&`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.data.orders)
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error('获取订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { 
        label: '待处理', 
        variant: 'secondary',
        icon: <Clock className="w-3 h-3" />
      },
      active: { 
        label: '运行中', 
        variant: 'default',
        icon: <CheckCircle className="w-3 h-3" />
      },
      inactive: { 
        label: '已停用', 
        variant: 'outline',
        icon: <XCircle className="w-3 h-3" />
      },
      deploying: { 
        label: '部署中', 
        variant: 'secondary',
        icon: <AlertCircle className="w-3 h-3" />
      }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const getOrderTypeIcon = (orderType: string) => {
    return orderType === 'hosting' ? (
      <Server className="w-5 h-5 text-blue-500" />
    ) : (
      <ImageIcon className="w-5 h-5 text-purple-500" />
    )
  }

  const getOrderTypeBadge = (orderType: string, description: string) => {
    return orderType === 'hosting' ? (
      <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
        <Server className="w-3 h-3 mr-1" />
        {description}
      </Badge>
    ) : (
      <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">
        <ImageIcon className="w-3 h-3 mr-1" />
        {description}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载订单数据...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-3xl font-bold">订单管理</h1>
        <p className="text-gray-600 mt-2">管理所有云节点托管和镜像节点订单</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">总订单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Server className="w-4 h-4" />
                云节点托管
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{stats.hosting}</div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                镜像节点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">{stats.image}</div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">待处理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{stats.by_status.pending}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            筛选器
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="hosting">
                <Server className="w-4 h-4 mr-2" />
                云节点托管
              </TabsTrigger>
              <TabsTrigger value="image">
                <ImageIcon className="w-4 h-4 mr-2" />
                镜像节点
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-4 flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              全部状态
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              待处理
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              运行中
            </Button>
            <Button
              variant={statusFilter === 'deploying' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('deploying')}
            >
              部署中
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 订单列表 */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">暂无订单数据</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getOrderTypeIcon(order.order_type)}
                    <div>
                      <CardTitle className="text-lg">{order.node_id}</CardTitle>
                      <CardDescription className="mt-1">
                        {order.wallet_address.slice(0, 10)}...{order.wallet_address.slice(-8)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getOrderTypeBadge(order.order_type, order.order_description)}
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">购买金额</p>
                    <p className="text-lg font-semibold">
                      {parseFloat(order.purchase_price).toLocaleString()} ASHVA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">总收益</p>
                    <p className="text-lg font-semibold text-green-600">
                      {parseFloat(order.total_earnings).toLocaleString()} ASHVA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">配置</p>
                    <p className="text-sm font-medium">
                      {order.cpu_cores}C / {order.memory_gb}G / {order.storage_gb}G
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">创建时间</p>
                    <p className="text-sm font-medium">
                      {new Date(order.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
