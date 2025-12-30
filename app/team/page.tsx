'use client';

import { useEffect, useState } from 'react';

interface Member {
  id: number;
  wallet_address: string;
  member_level: string;
  team_size: number;
  created_at: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.success) {
        // API 返回 data.items 或 data.data
        const memberList = data.data?.items || data.data || [];
        console.log('Members:', memberList);
        setMembers(Array.isArray(memberList) ? memberList : []);
      } else {
        setError('加载失败: ' + (data.message || '未知错误'));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('网络错误: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 计算统计
  const totalMembers = members.length;
  const level1Members = members.filter(m => m.member_level === 'normal' || !m.member_level).length;
  const level2Members = members.filter(m => m.member_level === 'market_partner').length;
  const level3Members = members.filter(m => m.member_level === 'global_partner').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-xl text-gray-900 font-medium">加载团队数据中...</div>
            <div className="text-sm text-gray-600 mt-2">请稍候</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-800 font-medium">加载错误</div>
            <div className="text-red-600 text-sm mt-2">{error}</div>
            <button
              onClick={fetchMembers}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">团队中心</h1>
          <p className="text-gray-600 mt-2">管理和查看团队成员信息</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium mb-2">团队总人数</div>
            <div className="text-4xl font-bold text-blue-600">{totalMembers}</div>
            <div className="text-xs text-gray-500 mt-2">累计团队成员</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium mb-2">普通会员</div>
            <div className="text-4xl font-bold text-green-600">{level1Members}</div>
            <div className="text-xs text-gray-500 mt-2">基础会员</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium mb-2">市场合伙人</div>
            <div className="text-4xl font-bold text-purple-600">{level2Members}</div>
            <div className="text-xs text-gray-500 mt-2">中级会员</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium mb-2">全球合伙人</div>
            <div className="text-4xl font-bold text-orange-600">{level3Members}</div>
            <div className="text-xs text-gray-500 mt-2">高级会员</div>
          </div>
        </div>

        {/* 团队成员列表 */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">团队成员列表</h2>
            <p className="text-sm text-gray-600 mt-1">共 {totalMembers} 名成员</p>
          </div>
          
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      钱包地址
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      会员等级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      团队人数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      加入时间
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.slice(0, 20).map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {member.wallet_address.substring(0, 6)}...
                        {member.wallet_address.substring(member.wallet_address.length - 4)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          member.member_level === 'global_partner'
                            ? 'bg-orange-100 text-orange-800'
                            : member.member_level === 'market_partner'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {member.member_level === 'global_partner'
                            ? '全球合伙人'
                            : member.member_level === 'market_partner'
                            ? '市场合伙人'
                            : '普通会员'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {member.team_size || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(member.created_at).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-lg mb-2">暂无团队成员</div>
              <button
                onClick={fetchMembers}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                刷新数据
              </button>
            </div>
          )}
          
          {members.length > 20 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-600">
              显示前 20 个成员，共 {members.length} 个成员
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
