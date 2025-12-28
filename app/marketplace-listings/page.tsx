'use client';
import { useEffect, useState } from 'react';
export default function MarketplaceListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/admin/marketplace-listings').then(res => res.json()).then(data => {
      if (data.success) setListings(data.data || []);
      else setError(data.error || 'Failed to load');
      setLoading(false);
    }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (error) return <div className="p-8"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div></div>;
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">市场挂单</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="text-xl font-semibold">当前挂单 ({listings.length})</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">卖家</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">节点ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listings.length === 0 ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">暂无数据</td></tr> :
                listings.map(listing => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{listing.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{listing.seller_address?.substring(0,10)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{listing.node_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">${listing.listing_price}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">{listing.status}</span></td>
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
