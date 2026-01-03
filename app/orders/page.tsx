'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, ImageIcon, Clock } from 'lucide-react'

interface Order {
  id: number
  node_id: string
  wallet_address: string
  node_type: string
  order_type: string
  order_description: string
  purchase_price: string
  staking_amount: string
  total_earnings: string
  status: string
  machine_id: string | null
  created_at: string
  member_level: string
}

interface Stats {
  total: number
  hosting: number
  image: number
  active: number
  pending: number
  totalPurchase: number
  totalEarnings: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, typeFilter, statusFilter])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      
      if (data.success) {
        const records = data.data.records || []
        setOrders(records)
        calculateStats(records)
      }
    } catch (error) {
      console.error('获取订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (records: Order[]) => {
    const hosting = records.filter(o => o.order_type === 'hosting').length
    const image = records.filter(o => o.order_type === 'image').length
    
    // 将未部署的订单视为pending状态
    const active = records.filter(o => o.status === 'active' && o.machine_id !== null).length
    const pending = records.filter(o => o.machine_id === null).length
    
    const totalPurchase = records.reduce((sum, o) => sum + parseFloat(o.purchase_price || '0'), 0)
    const totalEarnings = records.reduce((sum, o) => sum + parseFloat(o.total_earnings || '0'), 0)

    setStats({
      total: records.length,
      hosting,
      image,
      active,
      pending,
      totalPurchase,
      totalEarnings
    })
  }

  const filterOrders = () => {
    let filtered = [...orders]

    if (typeFilter !== 'all') {
      filtered = filtered.filter(o => o.order_type === typeFilter)
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        // 待部署 = machine_id为null
        filtered = filtered.filter(o => o.machine_id === null)
      } else if (statusFilter === 'active') {
        // 已部署 = machine_id不为null且status为active
        filtered = filtered.filter(o => o.status === 'active' && o.machine_id !== null)
      } else {
        filtered = filtered.filter(o => o.status === statusFilter)
      }
    }

    setFilteredOrders(filtered)
  }

  const getStatusBadge = (order: Order) => {
    // 如果machine_id为null,显示"待部署"
    if (order.machine_id === null) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          待部署
        </Badge>
      )
    }
    
    // 如果已经有machine_id,根据status显示
    if (order.status === 'active') {
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-200">
          运行中
        </Badge>
      )
    } else if (order.status === 'deploying') {
      return (
        <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
          部署中
        </Badge>
      )
    } else if (order.status === 'inactive') {
      return (
        <Badge className="bg-red-500/10 text-red-700 border-red-200">
          已停用
        </Badge>
      )
    }
    
    return <Badge>{order.status}</Badge>
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
              <p className="text-xs text-gray-500 mt-1">
                云节点: {stats.hosting} | 镜像: {stats.image}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">已部署</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{stats.active}</div>
              <p className="text-xs text-gray-500 mt-1">
                待部署: {stats.pending}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700">总购买额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {stats.totalPurchase.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">ASHVA</p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700">总收益</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {stats.totalEarnings.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">ASHVA</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选订单</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* 节点类型筛选 */}
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-2 rounded-lg ${
                  typeFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部类型
              </button>
              <button
                onClick={() => setTypeFilter('hosting')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  typeFilter === 'hosting'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <Server className="w-4 h-4" />
                云节点
              </button>
              <button
                onClick={() => setTypeFilter('image')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  typeFilter === 'image'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                镜像节点
              </button>
            </div>

            {/* 状态筛选 */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部状态
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                待部署
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-lg ${
                  statusFilter === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                运行中
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 订单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>订单列表 ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">订单ID</th>
                  <th className="text-left py-3 px-4">节点ID</th>
                  <th className="text-left py-3 px-4">钱包地址</th>
                  <th className="text-left py-3 px-4">类型</th>
                  <th className="text-right py-3 px-4">购买价格</th>
                  <th className="text-right py-3 px-4">质押金额</th>
                  <th className="text-right py-3 px-4">总收益</th>
                  <th className="text-center py-3 px-4">状态</th>
                  <th className="text-left py-3 px-4">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">#{order.id}</td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {order.node_id.substring(0, 20)}...
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {order.wallet_address.substring(0, 12)}...
                    </td>
                    <td className="py-3 px-4">
                      {getOrderTypeBadge(order.order_type, order.order_description)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {parseFloat(order.purchase_price).toFixed(2)} ASHVA
                    </td>
                    <td className="py-3 px-4 text-right">
                      {parseFloat(order.staking_amount).toFixed(2)} ASHVA
                    </td>
                    <td className="py-3 px-4 text-right text-green-600 font-semibold">
                      {parseFloat(order.total_earnings).toFixed(2)} ASHVA
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(order)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>没有找到符合条件的订单</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
