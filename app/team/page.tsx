'use client';

import { useEffect, useState } from 'react';

interface Member {
  id: string;
  wallet_address: string;
  level: number;
  team_count: number;
  join_date: string;
  status: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 加载团队成员数据
    fetch('/api/members')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch');
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.data) {
          setMembers(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading members:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">加载团队数据中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-xl text-red-600">加载失败: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  // 统计数据
  const totalMembers = members.length;
  const directMembers = members.filter(m => m.level === 1).length;
  const indirectMembers = totalMembers - directMembers;
  const activeMembers = members.filter(m => m.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">团队中心</h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">团队总人数</div>
            <div className="text-4xl font-bold text-blue-600">{totalMembers}</div>
            <div className="text-xs text-gray-500 mt-2">累计团队成员</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">直推人数</div>
            <div className="text-4xl font-bold text-green-600">{directMembers}</div>
            <div className="text-xs text-gray-500 mt-2">一级成员</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">间推人数</div>
            <div className="text-4xl font-bold text-purple-600">{indirectMembers}</div>
            <div className="text-xs text-gray-500 mt-2">二级及以下</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">活跃成员</div>
            <div className="text-4xl font-bold text-orange-600">{activeMembers}</div>
            <div className="text-xs text-gray-500 mt-2">当前活跃</div>
          </div>
        </div>

        {/* 团队成员列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">团队成员列表</h2>
          </div>
          
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">钱包地址</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">层级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">团队人数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">加入时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.slice(0, 20).map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {member.wallet_address.substring(0, 6)}...{member.wallet_address.substring(member.wallet_address.length - 4)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          member.level === 1 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          L{member.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{member.team_count || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {member.join_date ? new Date(member.join_date).toLocaleDateString('zh-CN') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status === 'active' ? '活跃' : '非活跃'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              暂无团队成员数据
            </div>
          )}
          
          {members.length > 20 && (
            <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500">
              显示前 20 个成员，共 {members.length} 个
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
