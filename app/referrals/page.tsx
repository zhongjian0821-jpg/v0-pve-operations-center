'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Referral {
  wallet_address: string;
  parent_wallet: string | null;
  member_level: string;
  team_size: number;
  total_earnings: number;
  level: number;
  created_at: string;
}

export default function ReferralsPage() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadReferrals();
  }, [router, pagination.page]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `/api/admin/referrals?page=${pagination.page}&limit=${pagination.limit}`,
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      const data = await response.json();
      
      if (data.success) {
        setReferrals(data.data.referrals || []);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
      } else {
        console.error('加载失败:', data.error);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIndent = (level: number) => {
    return { paddingLeft: `${(level - 1) * 2}rem` };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span>🤝</span>
            推荐关系管理
          </h1>
          <p className="text-gray-600 mt-2">查看和管理推荐关系链</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">推荐关系树</h2>
              <button
                onClick={loadReferrals}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                刷新
              </button>
            </div>
            {pagination.total > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                共 {pagination.total} 个钱包地址
              </p>
            )}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                加载中...
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-6xl mb-4">🤝</p>
                <p className="text-gray-500">暂无推荐关系数据</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          层级
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          钱包地址
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          上级地址
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          会员等级
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          团队人数
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          总收益
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          注册时间
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {referrals.map((item) => (
                        <tr key={item.wallet_address} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            L{item.level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                            <div style={getIndent(item.level)}>
                              {item.level > 1 && '└─ '}
                              {item.wallet_address.substring(0, 10)}...{item.wallet_address.substring(item.wallet_address.length - 8)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {item.parent_wallet ? 
                              `${item.parent_wallet.substring(0, 10)}...${item.parent_wallet.substring(item.parent_wallet.length - 8)}` : 
                              '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {item.member_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.team_size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.total_earnings.toFixed(2)} ASHVA
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 分页 */}
                {pagination.total > pagination.limit && (
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      显示 {((pagination.page - 1) * pagination.limit) + 1} 到 {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 条
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一页
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page * pagination.limit >= pagination.total}
                        className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
