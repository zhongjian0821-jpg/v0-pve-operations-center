'use client';

import { useEffect, useState } from 'react';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('TeamPage: Starting to fetch members...');
    
    fetch('/api/members')
      .then(res => {
        console.log('TeamPage: API response received', res.status);
        return res.json();
      })
      .then(data => {
        console.log('TeamPage: Data parsed:', data);
        
        if (data.success && data.data && data.data.items) {
          console.log('TeamPage: Found members:', data.data.items.length);
          setMembers(data.data.items);
        } else {
          console.log('TeamPage: No members found in response');
          setMembers([]);
        }
        
        setLoading(false);
        console.log('TeamPage: Loading complete');
      })
      .catch(err => {
        console.error('TeamPage: Error:', err);
        setMembers([]);
        setLoading(false);
      });
  }, []);

  console.log('TeamPage: Render - loading:', loading, 'members:', members.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">正在加载团队数据...</div>
          <div className="text-gray-600">请稍候</div>
        </div>
      </div>
    );
  }

  const totalMembers = members.length;
  const normalMembers = members.filter(m => m.member_level === 'normal').length;
  const marketPartners = members.filter(m => m.member_level === 'market_partner').length;
  const globalPartners = members.filter(m => m.member_level === 'global_partner').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">团队中心</h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">团队总人数</div>
            <div className="text-4xl font-bold text-blue-600">{totalMembers}</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">普通会员</div>
            <div className="text-4xl font-bold text-green-600">{normalMembers}</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">市场合伙人</div>
            <div className="text-4xl font-bold text-purple-600">{marketPartners}</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">全球合伙人</div>
            <div className="text-4xl font-bold text-orange-600">{globalPartners}</div>
          </div>
        </div>

        {/* 团队成员表格 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">团队成员列表</h2>
            <p className="text-sm text-gray-600 mt-1">共 {totalMembers} 名成员</p>
          </div>

          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">钱包地址</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">会员等级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ASHVA余额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">团队人数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">加入时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.slice(0, 20).map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-blue-600">
                        {member.wallet_address.substring(0, 6)}...{member.wallet_address.substring(member.wallet_address.length - 4)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          member.member_level === 'global_partner' ? 'bg-orange-100 text-orange-800' :
                          member.member_level === 'market_partner' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {member.member_level === 'global_partner' ? '全球合伙人' :
                           member.member_level === 'market_partner' ? '市场合伙人' :
                           '普通会员'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {parseFloat(member.ashva_balance).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
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
            <div className="px-6 py-12 text-center text-gray-500">
              暂无团队成员数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
