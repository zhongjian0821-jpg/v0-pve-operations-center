
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/purchases?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.success) setOrders(data.data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">订单管理</h1>
      <Card>
        <CardHeader><CardTitle>全部订单</CardTitle></CardHeader>
        <CardContent>
          {loading ? '加载中...' : (
            <table className="w-full">
              <thead><tr className="border-b">
                <th className="text-left p-4">订单ID</th>
                <th className="text-left p-4">用户</th>
                <th className="text-right p-4">金额</th>
                <th className="text-center p-4">状态</th>
                <th className="text-right p-4">时间</th>
              </tr></thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{order.id}</td>
                    <td className="p-4 font-mono text-sm">{order.wallet_address}</td>
                    <td className="text-right p-4">${order.amount_usd?.toFixed(2)}</td>
                    <td className="text-center p-4">{order.status}</td>
                    <td className="text-right p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
