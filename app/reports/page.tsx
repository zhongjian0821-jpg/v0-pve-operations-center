'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OverviewStats {
  totalUsers: number;
  totalNodes: number;
  totalOrders: number;
  totalWithdrawals: number;
  totalAshvaBalance: number;
}

interface FinancialData {
  date: string;
  total_amount: number;
  transaction_count: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [financial, setFinancial] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router, period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      // 加载概览数据
      const overviewResp = await fetch('/api/admin/reports/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const overviewData = await overviewResp.json();
      
      if (overviewData.success) {
        setOverview(overviewData.data);
      }

      // 加载财务数据
      const financialResp = await fetch(`/api/admin/reports/financial?days=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const financialData = await financialResp.json();
      
      if (financialData.success) {
        setFinancial(financialData.data.financialData || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: string }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span>📊</span>
            综合报表
          </h1>
          <p className="text-gray-600 mt-2">财务报表、收益分析、用户统计</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            加载中...
          </div>
        ) : (
          <>
            {/* 概览统计 */}
            {overview && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">平台概览</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard 
                    title="总用户数" 
                    value={overview.totalUsers.toLocaleString()} 
                    icon="👥" 
                  />
                  <StatCard 
                    title="总节点数" 
                    value={overview.totalNodes.toLocaleString()} 
                    icon="🖥️" 
                  />
                  <StatCard 
                    title="总订单数" 
                    value={overview.totalOrders.toLocaleString()} 
                    icon="📦" 
                  />
                  <StatCard 
                    title="提现金额" 
                    value={`${overview.totalWithdrawals.toFixed(2)}`} 
                    icon="💰" 
                  />
                  <StatCard 
                    title="ASHVA总量" 
                    value={`${overview.totalAshvaBalance.toFixed(2)}`} 
                    icon="💎" 
                  />
                </div>
              </div>
            )}

            {/* 财务数据 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">财务数据</h2>
                  <div className="flex gap-2">
                    <select
                      value={period}
                      onChange={(e) => setPeriod(parseInt(e.target.value))}
                      className="px-3 py-2 border rounded"
                    >
                      <option value="7">最近7天</option>
                      <option value="30">最近30天</option>
                      <option value="90">最近90天</option>
                    </select>
                    <button
                      onClick={loadData}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      刷新
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {financial.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-6xl mb-4">📊</p>
                    <p className="text-gray-500">暂无财务数据</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            日期
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            交易金额
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            交易笔数
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            平均金额
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {financial.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(item.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.total_amount.toFixed(2)} ASHVA
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.transaction_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(item.total_amount / item.transaction_count).toFixed(2)} ASHVA
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            合计
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {financial.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)} ASHVA
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {financial.reduce((sum, item) => sum + item.transaction_count, 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            -
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
