'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EarningsSummary {
  total_earnings: number;
  node_earnings: number;
  commission_earnings: number;
  today_earnings: number;
  monthly_earnings: number;
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const address = localStorage.getItem('wallet_address');
    if (address) {
      fetch(`/api/earnings/summary?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setEarnings(data.data);
          }
          setLoading(false);
        });
    }
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  if (!earnings) {
    return <div className="p-8">暂无收益数据</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">收益总览</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>总收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${earnings.total_earnings.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">累计总收益</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>节点收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${earnings.node_earnings.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">节点运行收益</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>佣金收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${earnings.commission_earnings.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">推广佣金</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>今日收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${earnings.today_earnings.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">今日新增</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>本月收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${earnings.monthly_earnings.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">本月累计</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>平均日收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(earnings.monthly_earnings / 30).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 mt-2">基于本月数据</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
