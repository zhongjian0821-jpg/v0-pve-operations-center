'use client';
import { useEffect, useState } from 'react';
export default function BlockchainMachinesPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/admin/blockchain/machines').then(res => res.json()).then(data => {
      if (data.success) setMachines(data.data || []);
      else setError(data.error || 'Failed');
      setLoading(false);
    }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (error) return <div className="p-8"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div></div>;
  return (
    <div className="p-8">
      <div className="mb-6"><h1 className="text-3xl font-bold">区块链托管 - 机器管理</h1><p className="text-gray-600 mt-2">管理客户的节点机器设备</p></div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="text-xl font-semibold">机器列表 ({machines.length})</h2></div>
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">所属客户</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">激活码</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">硬件信息</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最后心跳</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">激活时间</th>
          </tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {machines.length === 0 ? <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">暂无机器数据</td></tr> :
              machines.map(m => (<tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">{m.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{m.customer_name || `ID:${m.customer_id}`}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{m.activation_code}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded ${m.status === 'online' ? 'bg-green-100 text-green-800' : m.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{m.status}</span></td>
                <td className="px-6 py-4 text-sm max-w-xs truncate">{m.hardware_info || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.last_heartbeat ? new Date(m.last_heartbeat).toLocaleString('zh-CN') : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.activated_at ? new Date(m.activated_at).toLocaleString('zh-CN') : '-'}</td>
              </tr>))
            }
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
