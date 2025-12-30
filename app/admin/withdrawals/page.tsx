
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/withdraw?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.success) setWithdrawals(data.data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">提现审核</h1>
      <Card>
        <CardHeader><CardTitle>提现申请</CardTitle></CardHeader>
        <CardContent>
          {loading ? '加载中...' : (
            <table className="w-full">
              <thead><tr className="border-b">
                <th className="text-left p-4">用户</th>
                <th className="text-right p-4">金额</th>
                <th className="text-center p-4">状态</th>
                <th className="text-right p-4">申请时间</th>
                <th className="text-center p-4">操作</th>
              </tr></thead>
              <tbody>
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">{w.wallet_address}</td>
                    <td className="text-right p-4">${w.amount?.toFixed(2)}</td>
                    <td className="text-center p-4">{w.status}</td>
                    <td className="text-right p-4">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="text-center p-4">
                      <button className="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2">批准</button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded text-sm">拒绝</button>
                    </td>
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
