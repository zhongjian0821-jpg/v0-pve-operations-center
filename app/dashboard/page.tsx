"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'

const Header = ({ admin, onLogout }: any) => (
  <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        PVE 运营中心
      </h1>
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="text-slate-400 text-xs sm:text-sm">
          欢迎，<span className="text-white font-medium">{admin?.username}</span>
        </span>
        <button 
          onClick={onLogout} 
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition text-xs sm:text-sm"
        >
          退出
        </button>
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

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [adminData, nodesStats] = await Promise.all([api.getMe(), api.getNodesStats()])
      setAdmin(adminData.admin)
      setStats(nodesStats)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-400 text-base sm:text-lg">加载中...</span>
        </div>
      </div>
    )
  }

  const statsCards = [
    { title: '总节点', value: stats?.total || 0, icon: '🖥️', color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20' },
    { title: '活跃节点', value: stats?.active || 0, icon: '✅', color: 'from-green-500/10 to-emerald-500/10 border-green-500/20' },
    { title: '活跃率', value: `${stats?.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%`, icon: '📊', color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20' }
  ];

  const quickActions = [
    { icon: '🖥️', label: '节点管理', path: '/nodes', desc: '查看和管理所有节点' },
    { icon: '👛', label: '钱包管理', path: '/wallets', desc: '管理用户钱包' },
    { icon: '💸', label: '提现审核', path: '/withdrawals', desc: '审核提现申请' },
    { icon: '📦', label: '订单查看', path: '/orders', desc: '查看所有订单' }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Header admin={admin} onLogout={handleLogout} />
      <Nav active="/dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statsCards.map((card, index) => (
            <div key={index} className={`bg-gradient-to-br ${card.color} border rounded-xl p-4 sm:p-6 hover:scale-105 transition-transform`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm mb-1">{card.title}</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{card.value}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/5 rounded-xl flex items-center justify-center text-2xl sm:text-3xl">
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 快速操作 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-5 flex items-center gap-2">
            <span>⚡</span>
            <span>快速操作</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.path}
                className="group p-4 sm:p-5 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all border border-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{action.icon}</div>
                <div className="text-white font-semibold text-base sm:text-lg mb-1 group-hover:text-blue-400 transition-colors">{action.label}</div>
                <div className="text-slate-400 text-xs sm:text-sm">{action.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
