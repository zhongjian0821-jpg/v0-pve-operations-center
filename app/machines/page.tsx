"use client"

import { useState, useEffect } from 'react'

interface Machine {
  id: number
  machine_id: string
  wallet_address: string
  hostname: string
  ip_address: string
  status: 'online' | 'offline'
  cpu_cores: number
  total_memory: number
  total_disk: number
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  allocated_owner: number
  allocated_pool: number
  last_heartbeat: string
  activated_at: string
  created_at: string
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all')

  useEffect(() => {
    fetchMachines()
    const interval = setInterval(fetchMachines, 30000) // 每30秒刷新
    return () => clearInterval(interval)
  }, [])

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/admin/machines')
      const data = await response.json()
      if (data.success) {
        setMachines(data.data)
      }
    } catch (error) {
      console.error('获取机器列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.machine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || machine.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const onlineMachines = machines.filter(m => m.status === 'online').length
  const offlineMachines = machines.filter(m => m.status === 'offline').length

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 顶部导航 */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white">机器管理</h1>
            <button
              onClick={fetchMachines}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              🔄 刷新
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">总机器数</p>
                <p className="text-3xl font-bold text-white">{machines.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🖥️</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">在线</p>
                <p className="text-3xl font-bold text-green-400">{onlineMachines}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">离线</p>
                <p className="text-3xl font-bold text-red-400">{offlineMachines}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="搜索机器ID、主机名或钱包地址..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setStatusFilter('online')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === 'online'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                在线
              </button>
              <button
                onClick={() => setStatusFilter('offline')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === 'offline'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                离线
              </button>
            </div>
          </div>
        </div>

        {/* 机器列表 */}
        {loading ? (
          <div className="bg-slate-900 rounded-xl p-12 border border-slate-800 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 mb-4"></div>
            <p className="text-slate-400">加载中...</p>
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="bg-slate-900 rounded-xl p-12 border border-slate-800 text-center">
            <p className="text-slate-400 text-lg">暂无机器</p>
            <p className="text-slate-500 text-sm mt-2">等待用户激活机器上线</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredMachines.map((machine) => (
              <div
                key={machine.id}
                className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition"
              >
                <div className="p-6">
                  {/* 头部 */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{machine.hostname}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          machine.status === 'online'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {machine.status === 'online' ? '在线' : '离线'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm font-mono">{machine.machine_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs mb-1">钱包地址</p>
                      <p className="text-slate-300 font-mono text-sm">{machine.wallet_address.substring(0, 10)}...{machine.wallet_address.substring(36)}</p>
                    </div>
                  </div>

                  {/* 硬件信息 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">CPU</p>
                      <p className="text-white font-semibold">{machine.cpu_cores} 核</p>
                      <div className="mt-2 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${machine.cpu_usage}%` }}
                        ></div>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{machine.cpu_usage.toFixed(1)}%</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">内存</p>
                      <p className="text-white font-semibold">{(machine.total_memory / 1024).toFixed(0)} GB</p>
                      <div className="mt-2 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${machine.memory_usage}%` }}
                        ></div>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{machine.memory_usage.toFixed(1)}%</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">磁盘</p>
                      <p className="text-white font-semibold">{(machine.total_disk / 1024).toFixed(0)} GB</p>
                      <div className="mt-2 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all"
                          style={{ width: `${machine.disk_usage}%` }}
                        ></div>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{machine.disk_usage.toFixed(1)}%</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">IP 地址</p>
                      <p className="text-white font-semibold text-sm">{machine.ip_address}</p>
                      <p className="text-slate-400 text-xs mt-2">最后心跳</p>
                      <p className="text-slate-300 text-xs">{new Date(machine.last_heartbeat).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>

                  {/* 算力分配 */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-300 font-semibold mb-3">算力分配</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-400 text-sm">所有者</span>
                          <span className="text-blue-400 font-semibold">{machine.allocated_owner} 插槽</span>
                        </div>
                        <div className="bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: '50%' }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-400 text-sm">算力池</span>
                          <span className="text-purple-400 font-semibold">{machine.allocated_pool} 插槽</span>
                        </div>
                        <div className="bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: '50%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
