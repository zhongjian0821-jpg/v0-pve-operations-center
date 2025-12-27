"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'

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
        <div className="text-blue-400 text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            PVE 运营中心
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">欢迎，<span className="text-white">{admin?.username}</span></span>
            <button onClick={handleLogout} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition">
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2">
            {[
              { name: '仪表板', path: '/dashboard', icon: '📊' },
              { name: '节点管理', path: '/nodes', icon: '🖥️' },
              { name: '钱包管理', path: '/wallets', icon: '👛' },
              { name: '提现管理', path: '/withdrawals', icon: '💸' },
              { name: '订单管理', path: '/orders', icon: '📦' }
            ].map(item => (
              <a
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-4 py-3 transition ${
                  item.path === '/dashboard'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">总节点数</p>
                <p className="text-4xl font-bold text-white mt-2">{stats?.total || 0}</p>
              </div>
              <div className="text-4xl">🖥️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">活跃节点</p>
                <p className="text-4xl font-bold text-white mt-2">{stats?.active || 0}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">活跃率</p>
                <p className="text-4xl font-bold text-white mt-2">
                  {stats?.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-5">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🖥️', label: '节点管理', path: '/nodes' },
              { icon: '👛', label: '钱包管理', path: '/wallets' },
              { icon: '💸', label: '提现审核', path: '/withdrawals' },
              { icon: '📦', label: '订单查看', path: '/orders' }
            ].map(action => (
              <a
                key={action.path}
                href={action.path}
                className="p-5 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition border border-slate-700 hover:border-blue-500/50 text-center"
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <div className="text-white font-semibold">{action.label}</div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
