'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TabType = 'records' | 'distribution' | 'stats';

interface Commission {
  id: number;
  from_wallet: string;
  amount: number;
  level: number;
  created_at: string;
}

export default function CommissionsEnhancedPage() {
  const [activeTab, setActiveTab] = useState<TabType>('records');
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const address = localStorage.getItem('wallet_address');
    if (address) {
      // 加载佣金记录
      fetch(`/api/commissions?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setCommissions(data.data || []);
          setLoading(false);
        });

      // 加载统计数据
      fetch(`/api/commissions/stats?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setStats(data.data);
        });
    }
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  const tabs = [
    { id: 'records', label: '佣金记录' },
    { id: 'distribution', label: '佣金分配' },
    { id: 'stats', label: '统计分析' },
  ];

  // 计算佣金分配
  const level1 = commissions.filter(c => c.level === 1);
  const level2 = commissions.filter(c => c.level === 2);
  const level3 = commissions.filter(c => c.level === 3);

  const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);
  const level1Amount = level1.reduce((sum, c) => sum + c.amount, 0);
  const level2Amount = level2.reduce((sum, c) => sum + c.amount, 0);
  const level3Amount = level3.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">佣金中心</h1>

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

      {/* 佣金记录标签 */}
      {activeTab === 'records' && (
        <Card>
          <CardHeader><CardTitle>全部佣金记录</CardTitle></CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无佣金记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">来源钱包</th>
                      <th className="text-center p-4">层级</th>
                      <th className="text-right p-4">佣金金额</th>
                      <th className="text-right p-4">获得时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map(commission => (
                      <tr key={commission.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono text-sm">
                          {commission.from_wallet.substring(0, 10)}...
                        </td>
                        <td className="text-center p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            commission.level === 1 ? 'bg-blue-100 text-blue-800' :
                            commission.level === 2 ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            L{commission.level}
                          </span>
                        </td>
                        <td className="text-right p-4 font-bold">
                          ${commission.amount.toFixed(2)}
                        </td>
                        <td className="text-right p-4">
                          {new Date(commission.created_at).toLocaleDateString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 佣金分配标签 */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader><CardTitle>总佣金</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-500 mt-2">
                  {commissions.length} 笔记录
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>一级佣金</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ${level1Amount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {level1.length} 笔 ({totalAmount > 0 ? (level1Amount/totalAmount*100).toFixed(1) : 0}%)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>二级佣金</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${level2Amount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {level2.length} 笔 ({totalAmount > 0 ? (level2Amount/totalAmount*100).toFixed(1) : 0}%)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>三级佣金</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  ${level3Amount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {level3.length} 笔 ({totalAmount > 0 ? (level3Amount/totalAmount*100).toFixed(1) : 0}%)
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>各级佣金占比</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>一级佣金</span>
                    <span className="font-bold">${level1Amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{width: `${totalAmount > 0 ? (level1Amount/totalAmount*100) : 0}%`}}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>二级佣金</span>
                    <span className="font-bold">${level2Amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{width: `${totalAmount > 0 ? (level2Amount/totalAmount*100) : 0}%`}}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>三级佣金</span>
                    <span className="font-bold">${level3Amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-yellow-500 h-3 rounded-full transition-all"
                      style={{width: `${totalAmount > 0 ? (level3Amount/totalAmount*100) : 0}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 统计分析标签 */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>今日佣金</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.today || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>本月佣金</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.monthly || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>累计佣金</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>平均佣金</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${commissions.length > 0 ? (totalAmount / commissions.length).toFixed(2) : '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>最高单笔</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${commissions.length > 0 ? Math.max(...commissions.map(c => c.amount)).toFixed(2) : '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>活跃用户</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {new Set(commissions.map(c => c.from_wallet)).size}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
