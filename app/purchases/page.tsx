'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Purchase {
  id: number;
  purchase_type: string;
  amount_ashva: number;
  amount_usd: number;
  status: string;
  created_at: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const address = localStorage.getItem('wallet_address');
    if (address) {
      fetch(`/api/purchases?wallet=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPurchases(data.data);
          }
          setLoading(false);
        });
    }
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">购买记录</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>全部购买记录</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无购买记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">类型</th>
                    <th className="text-right p-4">ASHVA金额</th>
                    <th className="text-right p-4">USD金额</th>
                    <th className="text-center p-4">状态</th>
                    <th className="text-right p-4">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{purchase.purchase_type}</td>
                      <td className="text-right p-4">{purchase.amount_ashva.toFixed(2)}</td>
                      <td className="text-right p-4">${purchase.amount_usd.toFixed(2)}</td>
                      <td className="text-center p-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                          purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td className="text-right p-4">
                        {new Date(purchase.created_at).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
