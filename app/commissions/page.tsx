
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const address = localStorage.getItem('wallet_address');
    if (address) {
      fetch(\`/api/commissions?address=\${address}\`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setCommissions(data.data);
          setLoading(false);
        });
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">佣金记录</h1>
      <Card>
        <CardHeader><CardTitle>全部佣金</CardTitle></CardHeader>
        <CardContent>
          {loading ? '加载中...' : commissions.length === 0 ? '暂无佣金记录' : (
            <table className="w-full">
              <thead><tr className="border-b">
                <th className="text-left p-4">来源</th>
                <th className="text-right p-4">金额</th>
                <th className="text-right p-4">时间</th>
              </tr></thead>
              <tbody>
                {commissions.map((c: any) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-4">{c.from_wallet}</td>
                    <td className="text-right p-4">\${c.amount?.toFixed(2)}</td>
                    <td className="text-right p-4">{new Date(c.created_at).toLocaleDateString()}</td>
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
