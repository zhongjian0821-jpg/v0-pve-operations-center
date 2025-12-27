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


export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([])
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [adminData, walletsData] = await Promise.all([api.getMe(), api.getWallets()])
      setAdmin(adminData.admin)
      setWallets(walletsData.wallets || [])
    } catch (err) {
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async (address: string) => {
    if (!confirm('确定要封禁此钱包吗？')) return
    try {
      await api.banWallet(address, '管理员封禁')
      alert('封禁成功')
      loadData()
    } catch (err: any) {
      alert('封禁失败：' + err.message)
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
      <Nav active="/wallets" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>👛</span>
              <span>钱包管理</span>
              <span className="ml-auto text-xs sm:text-sm font-normal text-slate-400">共 {wallets.length} 个</span>
            </h2>
          </div>
          
          {/* 移动端卡片 */}
          <div className="block sm:hidden divide-y divide-slate-800">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 mb-1">钱包地址</p>
                    <p className="text-sm text-slate-300 font-mono truncate">{wallet.wallet_address}</p>
                  </div>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    wallet.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {wallet.status === 'active' ? '正常' : '已封禁'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-slate-400 mb-0.5">余额</p>
                    <p className="text-slate-300 font-semibold">{wallet.ashva_balance || '0'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-0.5">质押</p>
                    <p className="text-slate-300 font-semibold">{wallet.total_staked || '0'}</p>
                  </div>
                </div>
                {wallet.status === 'active' && (
                  <button
                    onClick={() => handleBan(wallet.wallet_address)}
                    className="w-full px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-medium transition"
                  >
                    封禁
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 桌面端表格 */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">钱包地址</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">ASHVA余额</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">质押总额</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">状态</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {wallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-300 font-mono">{wallet.wallet_address.substring(0, 12)}...{wallet.wallet_address.substring(38)}</td>
                    <td className="px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-300 font-semibold">{wallet.ashva_balance || '0'}</td>
                    <td className="px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-300 font-semibold">{wallet.total_staked || '0'}</td>
                    <td className="px-4 lg:px-6 py-3 sm:py-4">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        wallet.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {wallet.status === 'active' ? '正常' : '已封禁'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 sm:py-4">
                      {wallet.status === 'active' && (
                        <button
                          onClick={() => handleBan(wallet.wallet_address)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs sm:text-sm font-medium transition"
                        >
                          封禁
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
