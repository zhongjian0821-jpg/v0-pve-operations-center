'use client';

import { useEffect, useState } from 'react';

type TabType = 'overview' | 'hierarchy' | 'referrals';

interface Member {
  id: string;
  wallet_address: string;
  level: number;
  team_count: number;
  join_date: string;
  status: string;
}

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载团队成员数据
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setMembers(data.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '团队概况' },
    { id: 'hierarchy', label: '团队层级' },
    { id: 'referrals', label: '推荐管理' },
  ];

  // 统计数据
  const totalMembers = members.length;
  const directMembers = members.filter(m => m.level === 1).length;
  const indirectMembers = totalMembers - directMembers;
  const activeMembers = members.filter(m => m.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">团队中心</h1>

        {/* 标签导航 */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
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

        {/* 团队概况 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="text-xs text-gray-500 mt-2">二级及以下成员</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-2">活跃成员</div>
                <div className="text-4xl font-bold text-orange-600">{activeMembers}</div>
                <div className="text-xs text-gray-500 mt-2">当前活跃中</div>
              </div>
            </div>

            {/* 团队成员列表 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">团队成员</h2>
              </div>
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
                    {members.length > 0 ? (
                      members.slice(0, 20).map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                            {member.wallet_address.slice(0, 6)}...{member.wallet_address.slice(-4)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              member.level === 1 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              L{member.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{member.team_count}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(member.join_date).toLocaleDateString('zh-CN')}
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          暂无团队成员
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {members.length > 20 && (
                <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500">
                  显示前 20 个成员，共 {members.length} 个
                </div>
              )}
            </div>
          </div>
        )}

        {/* 团队层级 */}
        {activeTab === 'hierarchy' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">团队层级结构</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(level => {
                const levelMembers = members.filter(m => m.level === level);
                return (
                  <div key={level} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-900">第 {level} 层</h3>
                      <span className="text-sm text-gray-600">{levelMembers.length} 人</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {levelMembers.length > 0 ? `包含 ${levelMembers.length} 名成员` : '暂无成员'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 推荐管理 */}
        {activeTab === 'referrals' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">推荐管理</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">推荐链接</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value="https://v0-pve-operations-center.vercel.app/register?ref=0x..."
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => alert('链接已复制')}
                  >
                    复制
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">推荐统计</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">直推人数</div>
                    <div className="text-2xl font-bold text-blue-600">{directMembers}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">间推人数</div>
                    <div className="text-2xl font-bold text-purple-600">{indirectMembers}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
