"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'


const Header = ({ admin, onLogout }: any) => (
  <header className="bg-slate-900 border-b border-slate-800">
    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">PVE 运营中心</h1>
      <div className="flex items-center gap-4">
        <span className="text-slate-400">欢迎，<span className="text-white">{admin?.username}</span></span>
        <button onClick={onLogout} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">退出</button>
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
          { name: '订单管理', path: '/orders', icon: '📦' }
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


export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [adminData, withdrawalsData] = await Promise.all([api.getMe(), api.getWithdrawals()])
      setAdmin(adminData.admin)
      setWithdrawals(withdrawalsData.withdrawals || [])
    } catch (err) {
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('确定批准此提现申请？')) return
    try {
      await api.approveWithdrawal(id)
      alert('批准成功')
      loadData()
    } catch (err: any) {
      alert('批准失败：' + err.message)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('请输入拒绝理由：')
    if (!reason) return
    try {
      await api.rejectWithdrawal(id, reason)
      alert('已拒绝')
      loadData()
    } catch (err: any) {
      alert('操作失败：' + err.message)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="text-blue-400">加载中...</div></div>

  return (
    <div className="min-h-screen bg-slate-950">
      <Header admin={admin} onLogout={() => { api.logout(); window.location.href = '/login'; }} />
      <Nav active="/withdrawals" />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>💸</span>
              <span>提现管理</span>
              <span className="ml-auto text-sm font-normal text-slate-400">共 {withdrawals.length} 条记录</span>
            </h2>
          </div>
          
          {withdrawals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-5xl mb-4">📭</div>
              <p>暂无提现申请</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">钱包地址</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">提现金额</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">目标地址</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">{w.wallet_address.substring(0, 10)}...{w.wallet_address.substring(38)}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-semibold">{w.amount}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">{w.to_address.substring(0, 10)}...{w.to_address.substring(38)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          w.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {w.status === 'pending' ? '待审核' : w.status === 'approved' ? '已批准' : '已拒绝'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{new Date(w.created_at).toLocaleString('zh-CN')}</td>
                      <td className="px-6 py-4">
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(w.id)} className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm font-medium">批准</button>
                            <button onClick={() => handleReject(w.id)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-medium">拒绝</button>
                          </div>
                        )}
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
