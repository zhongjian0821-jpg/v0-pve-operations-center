"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'

const Header = ({ admin, onLogout }: any) => (
  <header className="bg-slate-800 border-b border-slate-700">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">PVE Operations</h1>
      <div className="flex items-center gap-4">
        <span className="text-slate-400">Welcome, {admin?.username}</span>
        <button onClick={onLogout} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">Logout</button>
      </div>
    </div>
  </header>
);

const Nav = ({ active }: { active: string }) => (
  <nav className="bg-slate-800 border-b border-slate-700">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex gap-1">
        {[
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Nodes', path: '/nodes' },
          { name: 'Wallets', path: '/wallets' },
          { name: 'Withdrawals', path: '/withdrawals' },
          { name: 'Orders', path: '/orders' }
        ].map(item => (
          <a key={item.path} href={item.path} className={`px-4 py-3 ${active === item.path ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white transition'}`}>{item.name}</a>
        ))}
      </div>
    </div>
  </nav>
);

export default function NodesPage() {
  const [nodes, setNodes] = useState<any[]>([])
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [adminData, nodesData] = await Promise.all([api.getMe(), api.getNodes()])
      setAdmin(adminData.admin)
      setNodes(nodesData.nodes || [])
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

  return (
    <div className="min-h-screen bg-slate-900">
      <Header admin={admin} onLogout={handleLogout} />
      <Nav active="/nodes" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Node Management</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Node ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Wallet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Rewards</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {nodes.map((node) => (
                    <tr key={node.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">{node.node_id.substring(0, 20)}...</td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">{node.wallet_address.substring(0, 10)}...</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{node.node_type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${node.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-400'}`}>{node.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{node.total_rewards || '0'}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{new Date(node.created_at).toLocaleDateString()}</td>
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
