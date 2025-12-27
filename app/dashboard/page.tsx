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
      const [adminData, nodesStats] = await Promise.all([
        api.getMe(),
        api.getNodesStats()
      ])
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-blue-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            PVE Operations
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Welcome, {admin?.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <a href="/dashboard" className="px-4 py-3 text-blue-400 border-b-2 border-blue-400">
              Dashboard
            </a>
            <a href="/nodes" className="px-4 py-3 text-slate-400 hover:text-white transition">
              Nodes
            </a>
            <a href="/wallets" className="px-4 py-3 text-slate-400 hover:text-white transition">
              Wallets
            </a>
            <a href="/withdrawals" className="px-4 py-3 text-slate-400 hover:text-white transition">
              Withdrawals
            </a>
            <a href="/orders" className="px-4 py-3 text-slate-400 hover:text-white transition">
              Orders
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Nodes</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🖥️</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Nodes</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.active || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Activity Rate</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats?.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/nodes" className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition text-center">
              <div className="text-3xl mb-2">🖥️</div>
              <div className="text-white font-medium">Manage Nodes</div>
            </a>
            <a href="/wallets" className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition text-center">
              <div className="text-3xl mb-2">👛</div>
              <div className="text-white font-medium">Manage Wallets</div>
            </a>
            <a href="/withdrawals" className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition text-center">
              <div className="text-3xl mb-2">💸</div>
              <div className="text-white font-medium">Review Withdrawals</div>
            </a>
            <a href="/orders" className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-white font-medium">View Orders</div>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
