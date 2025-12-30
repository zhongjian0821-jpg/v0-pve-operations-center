'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TabType = 'overview' | 'hierarchy' | 'referrals';

interface TeamData {
  total: number;
  direct: number;
  indirect: number;
  active: number;
}

export default function TeamEnhancedPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [team, setTeam] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const address = localStorage.getItem('wallet_address');
    if (address) {
      // 加载团队数据
      fetch(`/api/team?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setTeam(data.data);
          setLoading(false);
        });

      // 加载团队成员
      fetch(`/api/team/members?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setMembers(data.data || []);
        });

      // 生成推荐链接
      setReferralLink(`https://v0-pve-operations-center.vercel.app/register?ref=${address}`);
    }
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  const tabs = [
    { id: 'overview', label: '团队概况' },
    { id: 'hierarchy', label: '团队层级' },
    { id: 'referrals', label: '推荐链接' },
  ];

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert('推荐链接已复制！');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">团队中心</h1>

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

      {/* 团队概况标签 */}
      {activeTab === 'overview' && team && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader><CardTitle>团队总人数</CardTitle></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">{team.total || 0}</div>
                <div className="text-sm text-gray-500 mt-2">累计团队成员</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>直推人数</CardTitle></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">{team.direct || 0}</div>
                <div className="text-sm text-gray-500 mt-2">一级成员</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>间推人数</CardTitle></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-yellow-600">{team.indirect || 0}</div>
                <div className="text-sm text-gray-500 mt-2">二级及以下</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>活跃成员</CardTitle></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-600">{team.active || 0}</div>
                <div className="text-sm text-gray-500 mt-2">30天内活跃</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>团队统计</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">直推占比</span>
                  <span className="font-bold text-lg">
                    {team.total > 0 ? ((team.direct / team.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{width: `${team.total > 0 ? (team.direct / team.total) * 100 : 0}%`}}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-gray-600">活跃率</span>
                  <span className="font-bold text-lg">
                    {team.total > 0 ? ((team.active / team.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all"
                    style={{width: `${team.total > 0 ? (team.active / team.total) * 100 : 0}%`}}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 团队层级标签 */}
      {activeTab === 'hierarchy' && (
        <Card>
          <CardHeader><CardTitle>团队成员列表</CardTitle></CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无团队成员</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">钱包地址</th>
                      <th className="text-center p-4">层级</th>
                      <th className="text-center p-4">状态</th>
                      <th className="text-right p-4">加入时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member: any) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono text-sm">
                          {member.wallet_address?.substring(0, 10)}...
                        </td>
                        <td className="text-center p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            member.level === 1 ? 'bg-green-100 text-green-800' :
                            member.level === 2 ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            L{member.level || 1}
                          </span>
                        </td>
                        <td className="text-center p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            member.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.active ? '活跃' : '不活跃'}
                          </span>
                        </td>
                        <td className="text-right p-4">
                          {new Date(member.created_at).toLocaleDateString('zh-CN')}
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

      {/* 推荐链接标签 */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>我的推荐链接</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    推荐链接
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 font-mono text-sm"
                    />
                    <button
                      onClick={copyReferralLink}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      复制
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">推荐奖励规则</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• 一级推荐：获得直推用户 10% 的收益佣金</li>
                    <li>• 二级推荐：获得间推用户 5% 的收益佣金</li>
                    <li>• 三级推荐：获得三级用户 2% 的收益佣金</li>
                    <li>• 佣金实时到账，可随时提现</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>推荐统计</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{team?.direct || 0}</div>
                  <div className="text-sm text-gray-500 mt-2">直推人数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{team?.indirect || 0}</div>
                  <div className="text-sm text-gray-500 mt-2">间推人数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{team?.total || 0}</div>
                  <div className="text-sm text-gray-500 mt-2">总推荐人数</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
