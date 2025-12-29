"use client"

import { useState, useEffect } from 'react'

interface ActivationCode {
  id: number
  code: string
  wallet_address: string
  blockchain: string
  status: 'unused' | 'used'
  used_at: string | null
  created_at: string
}

export default function ActivationCodesPage() {
  const [codes, setCodes] = useState<ActivationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // 表单数据
  const [walletAddress, setWalletAddress] = useState('')
  const [blockchain, setBlockchain] = useState('cosmos')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unused' | 'used'>('all')

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/activation-codes')
      const data = await response.json()
      if (data.success) {
        setCodes(data.data)
      }
    } catch (error) {
      console.error('获取激活码列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)

    try {
      const response = await fetch('/api/admin/activation-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          blockchain: blockchain
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`激活码生成成功！\n\n激活码: ${data.code}\n\n请复制并发送给用户`)
        setShowModal(false)
        setWalletAddress('')
        setBlockchain('cosmos')
        fetchCodes()
      } else {
        alert('生成失败: ' + data.error)
      }
    } catch (error) {
      console.error('生成激活码失败:', error)
      alert('生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const filteredCodes = codes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         code.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || code.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const unusedCount = codes.filter(c => c.status === 'unused').length
  const usedCount = codes.filter(c => c.status === 'used').length

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 顶部导航 */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white">激活码管理</h1>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              ➕ 生成激活码
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
                <p className="text-slate-400 text-sm mb-1">总激活码</p>
                <p className="text-3xl font-bold text-white">{codes.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎫</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">未使用</p>
                <p className="text-3xl font-bold text-yellow-400">{unusedCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">已使用</p>
                <p className="text-3xl font-bold text-green-400">{usedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
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
                placeholder="搜索激活码或钱包地址..."
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
                onClick={() => setStatusFilter('unused')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === 'unused'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                未使用
              </button>
              <button
                onClick={() => setStatusFilter('used')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === 'used'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                已使用
              </button>
            </div>
          </div>
        </div>

        {/* 激活码列表 */}
        {loading ? (
          <div className="bg-slate-900 rounded-xl p-12 border border-slate-800 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 mb-4"></div>
            <p className="text-slate-400">加载中...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="bg-slate-900 rounded-xl p-12 border border-slate-800 text-center">
            <p className="text-slate-400 text-lg">暂无激活码</p>
            <p className="text-slate-500 text-sm mt-2">点击上方按钮生成激活码</p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">激活码</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">钱包地址</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">区块链</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">创建时间</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">使用时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-white font-semibold">{code.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-300 text-sm">
                          {code.wallet_address.substring(0, 10)}...{code.wallet_address.substring(36)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold uppercase">
                          {code.blockchain}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          code.status === 'unused'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {code.status === 'unused' ? '未使用' : '已使用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(code.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {code.used_at ? new Date(code.used_at).toLocaleString('zh-CN') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 生成激活码模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">生成激活码</h2>
              
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    钱包地址
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    区块链类型
                  </label>
                  <select
                    value={blockchain}
                    onChange={(e) => setBlockchain(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="cosmos">Cosmos</option>
                    <option value="polygon">Polygon</option>
                    <option value="near">NEAR</option>
                    <option value="sui">SUI</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? '生成中...' : '生成'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
