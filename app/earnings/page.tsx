'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TabType = 'overview' | 'node' | 'commission' | 'records';

interface EarningsSummary {
  total_earnings: number;
  node_earnings: number;
  commission_earnings: number;
  today_earnings: number;
  monthly_earnings: number;
}

interface EarningRecord {
  id: number;
  type: string;
  amount: number;
  source: string;
  created_at: string;
}

export default function EarningsEnhancedPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const address = localStorage.getItem('wallet_address');
    if (address) {
      // 加载汇总数据
      fetch(`/api/earnings/summary?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setSummary(data.data);
        });

      // 加载详细记录
      fetch(`/api/earnings/records?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setRecords(data.data || []);
          setLoading(false);
        });
    }
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  const tabs = [
    { id: 'overview', label: '总览' },
    { id: 'node', label: '节点收益' },
    { id: 'commission', label: '佣金收益' },
    { id: 'records', label: '分配记录' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">收益中心</h1>

      {/* 标签导航 */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 总览标签 */}
      {activeTab === 'overview' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>总收益</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.total_earnings.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-2">累计总收益</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>节点收益</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.node_earnings.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-2">节点运行收益</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>佣金收益</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.commission_earnings.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-2">推广佣金</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>今日收益</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.today_earnings.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-2">今日新增</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>本月收益</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.monthly_earnings.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-2">本月累计</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>平均日收益</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(summary.monthly_earnings / 30).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-2">基于本月数据</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 节点收益标签 */}
      {activeTab === 'node' && (
        <Card>
          <CardHeader><CardTitle>节点收益明细</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">节点ID</th>
                    <th className="text-right p-4">收益金额</th>
                    <th className="text-right p-4">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {records.filter(r => r.type === 'node').map(record => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{record.source}</td>
                      <td className="text-right p-4">${record.amount.toFixed(2)}</td>
                      <td className="text-right p-4">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 佣金收益标签 */}
      {activeTab === 'commission' && (
        <Card>
          <CardHeader><CardTitle>佣金收益明细</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">来源</th>
                    <th className="text-right p-4">佣金金额</th>
                    <th className="text-right p-4">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {records.filter(r => r.type === 'commission').map(record => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{record.source}</td>
                      <td className="text-right p-4">${record.amount.toFixed(2)}</td>
                      <td className="text-right p-4">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分配记录标签 */}
      {activeTab === 'records' && (
        <Card>
          <CardHeader><CardTitle>收益分配记录</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">类型</th>
                    <th className="text-left p-4">来源</th>
                    <th className="text-right p-4">金额</th>
                    <th className="text-right p-4">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          record.type === 'node' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {record.type === 'node' ? '节点' : '佣金'}
                        </span>
                      </td>
                      <td className="p-4">{record.source}</td>
                      <td className="text-right p-4">${record.amount.toFixed(2)}</td>
                      <td className="text-right p-4">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
