
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
      });
  }, []);

  if (!stats) return <div className="p-8">加载中...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">管理员仪表板</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader><CardTitle>总用户数</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.total_users}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>总节点数</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.total_nodes}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>总收益</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">${stats.total_revenue?.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>活跃节点</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.active_nodes}</div></CardContent>
        </Card>
      </div>
    </div>
  );
}
