'use client';
import { useEffect, useState } from 'react';

export default function BlockchainCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/blockchain/customers')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCustomers(data.data || []);
        else setError(data.error || 'Failed to load');
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (error) return <div className="p-8"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div></div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">区块链托管 - 客户管理</h1>
        <p className="text-gray-600 mt-2">管理购买节点托管服务的客户</p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">客户列表 ({customers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">联系电话</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">钱包地址</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">机器数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">总收益</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-4 text-center text-gray-500">暂无客户数据</td></tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{c.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{c.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{c.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{c.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-xs">{c.wallet_address ? c.wallet_address.substring(0,10) + '...' : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{c.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{c.total_machines || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">${c.total_earnings || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.created_at).toLocaleString('zh-CN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
