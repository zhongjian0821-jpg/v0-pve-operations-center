
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/reports/overview')
      .then(res => res.json())
      .then(data => {
        if (data.success) setReports(data.data);
      });
  }, []);

  if (!reports) return <div className="p-8">加载中...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">报表中心</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>收入统计</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>今日收入: ${reports.today_revenue?.toFixed(2)}</div>
              <div>本月收入: ${reports.monthly_revenue?.toFixed(2)}</div>
              <div>总收入: ${reports.total_revenue?.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>用户统计</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>今日新增: {reports.today_users}</div>
              <div>本月新增: {reports.monthly_users}</div>
              <div>总用户: {reports.total_users}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
