'use client';
import { useEffect, useState } from 'react';
export default function ImageNodePurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/admin/image-node-purchases').then(res => res.json()).then(data => {
      if (data.success) setPurchases(data.data || []);
      else setError(data.error || 'Failed to load');
      setLoading(false);
    }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (error) return <div className="p-8"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div></div>;
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">镜像节点购买记录</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="text-xl font-semibold">购买列表 ({purchases.length})</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">购买者</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">镜像类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.length === 0 ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">暂无数据</td></tr> :
                purchases.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{p.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{p.wallet_address?.substring(0,10)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{p.image_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{p.device_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">${p.price}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
