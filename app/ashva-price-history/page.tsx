'use client';

import { useEffect, useState } from 'react';

export default function AshvaPriceHistoryPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/ashva-price-history')
      .then(res => res.json())
      .then(data => {
        if (data.success) setPrices(data.data || []);
        else setError(data.error || 'Failed to load prices');
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (error) return <div className="p-8"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div></div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">ASHVA价格历史</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">价格记录 ({prices.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格 (USD)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prices.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">暂无数据</td></tr>
              ) : (
                prices.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">${item.price_usd}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.timestamp).toLocaleString('zh-CN')}</td>
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
