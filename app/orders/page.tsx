"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'


const Header = ({ admin, onLogout }: any) => (
  <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">PVE 运营中心</h1>
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="text-slate-400 text-xs sm:text-sm">欢迎，<span className="text-white font-medium">{admin?.username}</span></span>
        <button onClick={onLogout} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition text-xs sm:text-sm">退出</button>
      </div>
    </div>
  </header>
);

const Nav = ({ active }: { active: string }) => {
  const navItems = [
    { name: '仪表板', path: '/dashboard', icon: '📊' },
    { name: '节点', path: '/nodes', icon: '🖥️' },
    { name: '钱包', path: '/wallets', icon: '👛' },
    { name: '提现', path: '/withdrawals', icon: '💸' },
    { name: '订单', path: '/orders', icon: '📦' }
  ];
  
  return (
    <nav className="bg-slate-900 border-b border-slate-800 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 sm:gap-2">
          {navItems.map(item => (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 transition-all whitespace-nowrap text-xs sm:text-sm ${
                active === item.path
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="text-sm sm:text-base">{item.icon}</span>
              <span className="font-medium hidden sm:inline">{item.name}</span>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-blue-400 text-base sm:text-lg">加载中...</span>
    </div>
  </div>
);


export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [adminData, ordersData] = await Promise.all([api.getMe(), api.getOrders()])
      setAdmin(adminData.admin)
      setOrders(ordersData.orders || [])
    } catch (err) {
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    api.logout()
    window.location.href = '/login'
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-slate-950">
      <Header admin={admin} onLogout={handleLogout} />
      <Nav active="/orders" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>📦</span>
              <span>订单管理</span>
              <span className="ml-auto text-xs sm:text-sm font-normal text-slate-400">共 {orders.length} 条</span>
            </h2>
          </div>
          
          {orders.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-400">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📦</div>
              <p className="text-sm sm:text-base">暂无订单记录</p>
            </div>
          ) : (
            <>
              {/* 移动端卡片 */}
              <div className="block sm:hidden divide-y divide-slate-800">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-1">订单 #{order.id}</p>
                        <p className="text-sm text-slate-300 font-mono truncate">{order.wallet_address}</p>
                      </div>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {order.status === 'completed' ? '已完成' : order.status === 'pending' ? '处理中' : '已取消'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400 mb-0.5">类型</p>
                        <p className="text-slate-300">{order.order_type}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-0.5">金额</p>
                        <p className="text-slate-300 font-semibold">{order.amount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 桌面端表格 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">订单ID</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">钱包地址</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">订单类型</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">金额</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">状态</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-300 font-mono">#{order.id}</td>
                        <td className="px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-300 font-mono">{order.wallet_address.substring(0, 10)}...{order.wallet_address.substring(38)}</td>
                        <td className="px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-300">{order.order_type}</td>
                        <td className="px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-300 font-semibold">{order.amount}</td>
                        <td className="px-4 lg:px-6 py-3 sm:py-4">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {order.status === 'completed' ? '已完成' : order.status === 'pending' ? '处理中' : '已取消'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-400">{new Date(order.created_at).toLocaleString('zh-CN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
