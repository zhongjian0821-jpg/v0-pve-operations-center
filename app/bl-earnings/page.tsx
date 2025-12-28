'use client';
import { useEffect, useState } from 'react';
export default function BlockchainEarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/admin/blockchain/earnings').then(res => res.json()).then(data => {
      if (data.success) setEarnings(data.data || []);
      else setError(data.error || 'Failed');
      setLoading(false);
    }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (error) return <div className="p-8"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div></div>;
  const totalEarnings = earnings.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  return (
    <div className="p-8">
      <div className="mb-6"><h1 className="text-3xl font-bold">区块链托管 - 收益记录</h1><p className="text-gray-600 mt-2">查看节点运营产生的收益</p></div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90">总收益</div>
          <div className="text-3xl font-bold mt-2">${totalEarnings.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90">记录数</div>
          <div className="text-3xl font-bold mt-2">{earnings.length}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90">平均每条</div>
          <div className="text-3xl font-bold mt-2">${earnings.length > 0 ? (totalEarnings / earnings.length).toFixed(2) : '0.00'}</div>
        </div>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="text-xl font-semibold">收益列表 ({earnings.length})</h2></div>
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">机器ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">节点ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">币种</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
          </tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {earnings.length === 0 ? <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">暂无收益数据</td></tr> :
              earnings.map(e => (<tr key={e.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">{e.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{e.machine_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{e.node_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">${parseFloat(e.amount).toFixed(8)}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">{e.currency}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(e.created_at).toLocaleString('zh-CN')}</td>
              </tr>))
            }
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
