"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'

const Header = ({ admin, onLogout }: any) => (
  <header className="bg-slate-900 border-b border-slate-800">
    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">PVE 运营中心</h1>
      <div className="flex items-center gap-4">
        {admin ? (
          <>
            <span className="text-slate-400">欢迎，<span className="text-white">{admin.username}</span></span>
            <button onClick={onLogout} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">退出</button>
          </>
        ) : (
          <a href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">登录</a>
        )}
      </div>
    </div>
  </header>
);

const Nav = ({ active }: { active: string }) => (
  <nav className="bg-slate-900 border-b border-slate-800">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex gap-2">
        {[
          { name: '仪表板', path: '/dashboard', icon: '📊' },
          { name: '节点管理', path: '/nodes', icon: '🖥️' },
          { name: '钱包管理', path: '/wallets', icon: '👛' },
          { name: '提现管理', path: '/withdrawals', icon: '💸' },
          { name: '订单管理', path: '/orders', icon: '📦' },
          { name: '团队中心', path: '/team', icon: '🌳' }
        ].map(item => (
          <a
            key={item.path}
            href={item.path}
            className={`flex items-center gap-2 px-4 py-3 transition ${
              active === item.path ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </a>
        ))}
      </div>
    </div>
  </nav>
);

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'cloud' | 'image'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setError(null)
      
      // 先检查登录状态
      const adminData = await api.getMe()
      setAdmin(adminData.admin)
      
      // 如果已登录，加载订单数据
      const ordersData = await api.getOrders()
      setOrders(ordersData.orders || [])
      setStats(ordersData.stats || {})
      
    } catch (err: any) {
      console.error('Load data error:', err)
      setError(err.message || '加载失败')
      
      // 如果是未授权错误，重定向到登录页
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'deploying': return 'bg-blue-500/20 text-blue-400'
      case 'inactive': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '已激活'
      case 'pending': return '待处理'
      case 'deploying': return '部署中'
      case 'inactive': return '未激活'
      default: return status
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.node_type !== filter) return false
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    return true
  })

  if (loading) return (
    <div className="min-h-screen bg-slate-950">
      <Header admin={admin} onLogout={() => { api.logout(); window.location.href = '/login'; }} />
      <div className="flex items-center justify-center h-96">
        <div className="text-blue-400">加载中...</div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-950">
      <Header admin={admin} onLogout={() => { api.logout(); window.location.href = '/login'; }} />
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">❌ {error}</div>
          <a href="/login" className="text-blue-400 hover:underline">返回登录</a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <Header admin={admin} onLogout={() => { api.logout(); window.location.href = '/login'; }} />
      <Nav active="/orders" />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 text-sm font-medium">总订单数</span>
                <span className="text-3xl">📦</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
              <div className="text-xs text-slate-400">
                云节点 {stats.cloud_nodes} | 镜像 {stats.image_nodes}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 text-sm font-medium">已激活</span>
                <span className="text-3xl">✅</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.active}</div>
              <div className="text-xs text-slate-400">
                待处理 {stats.pending} | 未激活 {stats.inactive}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-400 text-sm font-medium">总购买额</span>
                <span className="text-3xl">💰</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.total_purchase)}</div>
              <div className="text-xs text-slate-400">ASHVA</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-400 text-sm font-medium">总收益</span>
                <span className="text-3xl">💎</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.total_earnings)}</div>
              <div className="text-xs text-slate-400">ASHVA</div>
            </div>
          </div>
        )}

        {/* 筛选器 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">节点类型</label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'cloud', label: '云节点' },
                  { value: 'image', label: '镜像节点' }
                ].map(item => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value as any)}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      filter === item.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">订单状态</label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'active', label: '已激活' },
                  { value: 'pending', label: '待处理' },
                  { value: 'inactive', label: '未激活' }
                ].map(item => (
                  <button
                    key={item.value}
                    onClick={() => setStatusFilter(item.value as any)}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      statusFilter === item.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 订单列表 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📋</span>
              <span>订单列表</span>
              <span className="ml-auto text-sm font-normal text-slate-400">
                显示 {filteredOrders.length} / {orders.length} 条订单
              </span>
            </h2>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-5xl mb-4">📦</div>
              <p>没有符合条件的订单</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">节点ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">钱包地址</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">购买价格</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">质押金额</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">总收益</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                        {order.id.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                        {order.wallet_address.substring(0, 10)}...{order.wallet_address.substring(38)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.node_type === 'cloud' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {order.order_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                        {formatNumber(order.purchase_price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-yellow-400">
                        {formatNumber(order.staking_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-cyan-400 font-semibold">
                        {formatNumber(order.total_earnings)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(order.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
