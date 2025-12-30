'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Member {
  id: number;
  wallet_address: string;
  ashva_balance: string;
  member_level: string;
  parent_wallet: string | null;
  team_size: number;
  total_earnings: string;
  commission_rate_level1: string;
  commission_rate_level2: string;
  distributable_commission: string;
  distributed_commission: string;
  pending_withdrawal: string;
  total_withdrawn: string;
  created_at: string;
  updated_at: string;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [stats, setStats] = useState({
    totalMembers: 0,
    totalBalance: 0,
    totalEarnings: 0,
    normalMembers: 0,
    marketPartners: 0,
    globalPartners: 0,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, filterLevel, members]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      
      if (data.success) {
        const membersList = data.data.items || [];
        setMembers(membersList);
        
        const totalBalance = membersList.reduce((sum: number, m: Member) => 
          sum + parseFloat(m.ashva_balance), 0
        );
        const totalEarnings = membersList.reduce((sum: number, m: Member) => 
          sum + parseFloat(m.total_earnings), 0
        );
        
        const levelCounts = membersList.reduce((acc: any, m: Member) => {
          acc[m.member_level] = (acc[m.member_level] || 0) + 1;
          return acc;
        }, {});
        
        setStats({
          totalMembers: membersList.length,
          totalBalance,
          totalEarnings,
          normalMembers: levelCounts['normal'] || 0,
          marketPartners: levelCounts['market_partner'] || 0,
          globalPartners: levelCounts['global_partner'] || 0,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('获取会员数据失败:', error);
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterLevel !== 'all') {
      filtered = filtered.filter(m => m.member_level === filterLevel);
    }

    setFilteredMembers(filtered);
    setCurrentPage(1);
  };

  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600">加载中...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">会员管理中心</h1>
          <p className="text-gray-600 mt-2">管理和查看所有会员信息</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium opacity-90">总会员数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMembers}</div>
              <div className="text-sm opacity-75 mt-1">个会员账户</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium opacity-90">总余额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.totalBalance / 1000000).toLocaleString(undefined, {
                  maximumFractionDigits: 2
                })}M
              </div>
              <div className="text-sm opacity-75 mt-1">ASHVA</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium opacity-90">总收益</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.totalEarnings / 1000000).toLocaleString(undefined, {
                  maximumFractionDigits: 2
                })}M
              </div>
              <div className="text-sm opacity-75 mt-1">ASHVA</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium opacity-90">会员等级分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div>普通: {stats.normalMembers}</div>
                <div>市场: {stats.marketPartners}</div>
                <div>全球: {stats.globalPartners}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="搜索钱包地址..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-4 py-2 border rounded-md bg-white"
              >
                <option value="all">所有等级</option>
                <option value="normal">普通会员</option>
                <option value="market_partner">市场合伙人</option>
                <option value="global_partner">全球合伙人</option>
              </select>
              <Button onClick={fetchMembers} variant="outline">
                🔄 刷新数据
              </Button>
              <div className="ml-auto text-sm text-gray-600 flex items-center">
                共 {filteredMembers.length} 个会员
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 会员列表 */}
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-700">钱包地址</th>
                    <th className="text-right p-4 font-semibold text-gray-700">ASHVA余额</th>
                    <th className="text-center p-4 font-semibold text-gray-700">会员等级</th>
                    <th className="text-center p-4 font-semibold text-gray-700">团队人数</th>
                    <th className="text-right p-4 font-semibold text-gray-700">总收益</th>
                    <th className="text-right p-4 font-semibold text-gray-700">佣金率</th>
                    <th className="text-center p-4 font-semibold text-gray-700">加入时间</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-sm text-blue-600">
                          {member.wallet_address.slice(0, 10)}...{member.wallet_address.slice(-8)}
                        </div>
                        {member.parent_wallet && (
                          <div className="text-xs text-gray-500 mt-1">
                            上级: {member.parent_wallet.slice(0, 6)}...
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-bold text-gray-900">
                          {parseFloat(member.ashva_balance).toLocaleString(undefined, {
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          member.member_level === 'global_partner' 
                            ? 'bg-purple-100 text-purple-800' :
                          member.member_level === 'market_partner' 
                            ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.member_level === 'global_partner' ? '全球合伙人' :
                           member.member_level === 'market_partner' ? '市场合伙人' :
                           '普通会员'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-semibold">{member.team_size}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-green-600 font-semibold">
                          {parseFloat(member.total_earnings).toLocaleString(undefined, {
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-sm">
                          <div>L1: {member.commission_rate_level1}%</div>
                          <div className="text-gray-500">L2: {member.commission_rate_level2}%</div>
                        </div>
                      </td>
                      <td className="p-4 text-center text-sm text-gray-600">
                        {new Date(member.created_at).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">😔</div>
                <div className="text-gray-600">没有找到匹配的会员</div>
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                      className="w-10"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>数据实时更新 • 最后刷新: {new Date().toLocaleString('zh-CN')}</p>
        </div>
      </div>
    </div>
  );
}
