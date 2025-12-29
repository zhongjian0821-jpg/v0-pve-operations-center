'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AshvaPriceHistoryPage() {
  const router = useRouter();
  const [prices, setPrices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/login'); return; }
    fetchPrices();
  }, []);
  
  const fetchPrices = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/ashva-price-history?days=30', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPrices(data.data.prices || []);
        setStats(data.data.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div className="p-8">Loading...</div>;
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">📊 ASHVA价格历史</h1>
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">返回首页</button>
        </div>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-gray-400 text-sm mb-2">当前价格</div>
              <div className="text-2xl font-bold text-green-400">${parseFloat(stats.max_price || 0).toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-gray-400 text-sm mb-2">最高价</div>
              <div className="text-2xl font-bold">${parseFloat(stats.max_price || 0).toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-gray-400 text-sm mb-2">最低价</div>
              <div className="text-2xl font-bold">${parseFloat(stats.min_price || 0).toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-gray-400 text-sm mb-2">平均价</div>
              <div className="text-2xl font-bold">${parseFloat(stats.avg_price || 0).toFixed(4)}</div>
            </div>
          </div>
        )}
        
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">价格 (USD)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">来源</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {prices.map((price) => (
                  <tr key={price.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm">{price.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-400">${parseFloat(price.price_usd).toFixed(8)}</td>
                    <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded ${price.price_type === 'realtime' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>{price.price_type}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{price.source}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(price.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
