'use client';
import { useEffect, useState } from 'react';
export default function BlockchainNodesPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/admin/blockchain/nodes').then(res => res.json()).then(data => {
      if (data.success) setNodes(data.data || []);
      else setError(data.error || 'Failed');
      setLoading(false);
    }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (error) return <div className="p-8"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div></div>;
  return (
    <div className="p-8">
      <div className="mb-6"><h1 className="text-3xl font-bold">区块链托管 - 节点管理</h1><p className="text-gray-600 mt-2">管理部署的区块链节点</p></div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="text-xl font-semibold">节点列表 ({nodes.length})</h2></div>
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">机器激活码</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">节点类型</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">端口</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">配置</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
          </tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {nodes.length === 0 ? <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">暂无节点数据</td></tr> :
              nodes.map(n => (<tr key={n.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">{n.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{n.activation_code || `M-ID:${n.machine_id}`}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{n.node_type}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded ${n.status === 'running' ? 'bg-green-100 text-green-800' : n.status === 'deploying' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{n.status}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{n.port || '-'}</td>
                <td className="px-6 py-4 text-sm max-w-xs truncate">{n.config || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(n.created_at).toLocaleString('zh-CN')}</td>
              </tr>))
            }
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
