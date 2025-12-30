'use client';
// Fixed all text color issues

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    applyFilters();
  }, [searchTerm, filterLevel, members]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      
      if (data.success && data.data) {
        setMembers(data.data);
        calculateStats(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      setLoading(false);
    }
  };

  const calculateStats = (memberList: Member[]) => {
    const totalBalance = memberList.reduce((sum, m) => sum + parseFloat(m.ashva_balance || '0'), 0);
    const totalEarnings = memberList.reduce((sum, m) => sum + parseFloat(m.total_earnings || '0'), 0);
    
    const normalMembers = memberList.filter(m => m.member_level === 'normal').length;
    const marketPartners = memberList.filter(m => m.member_level === 'market_partner').length;
    const globalPartners = memberList.filter(m => m.member_level === 'global_partner').length;

    setStats({
      totalMembers: memberList.length,
      totalBalance,
      totalEarnings,
      normalMembers,
      marketPartners,
      globalPartners,
    });
  };

  const applyFilters = () => {
    let filtered = [...members];

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

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const getMemberLevelName = (level: string) => {
    const levels: { [key: string]: string } = {
      'normal': '普通会员',
      'market_partner': '市场合伙人',
      'global_partner': '全球合伙人',
    };
    return levels[level] || level;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">加载中...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">会员管理中心</h1>
        <p className="text-gray-600 mb-8">查看和管理所有会员信息</p>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总会员数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalMembers}</div>
              <p className="text-xs text-gray-500 mt-1">个会员账户</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总余额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {(stats.totalBalance / 1000000).toFixed(2)}M
              </div>
              <p className="text-xs text-gray-500 mt-1">ASHVA</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总收益</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {(stats.totalEarnings / 1000000).toFixed(2)}M
              </div>
              <p className="text-xs text-gray-500 mt-1">ASHVA</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">会员等级分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-sm text-gray-700">普通: {stats.normalMembers}</div>
                <div className="text-sm text-gray-700">市场: {stats.marketPartners}</div>
                <div className="text-sm text-gray-700">全球: {stats.globalPartners}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 - 修复版 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="搜索钱包地址..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ color: '#111827' }}
            >
              <option value="all" style={{ color: '#111827' }}>所有等级</option>
              <option value="normal" style={{ color: '#111827' }}>普通会员</option>
              <option value="market_partner" style={{ color: '#111827' }}>市场合伙人</option>
              <option value="global_partner" style={{ color: '#111827' }}>全球合伙人</option>
            </select>
            <button 
              onClick={fetchMembers}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium shadow-sm"
            >
              🔄 刷新数据
            </button>
            <div className="ml-auto text-sm font-medium text-gray-700">
              共 {filteredMembers.length} 个会员
            </div>
          </div>
        </div>

        {/* 会员列表 */}
        <Card>
          <CardContent className="p-0">
            {paginatedMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">钱包地址</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ASHVA余额</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">会员等级</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">团队人数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">总收益</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">佣金率</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">加入时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-blue-600">
                            {member.wallet_address.substring(0, 6)}...{member.wallet_address.substring(member.wallet_address.length - 4)}
                          </div>
                          {member.parent_wallet && (
                            <div className="text-xs text-gray-500 font-mono">
                              上级: {member.parent_wallet.substring(0, 6)}...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {parseFloat(member.ashva_balance).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.member_level === 'global_partner'
                              ? 'bg-purple-100 text-purple-800'
                              : member.member_level === 'market_partner'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getMemberLevelName(member.member_level)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.team_size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {parseFloat(member.total_earnings).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          L2: {parseFloat(member.commission_rate_level1) * 100}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(member.created_at).toLocaleDateString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                没有找到符合条件的会员
              </div>
            )}

            {/* 分页 - 完全修复版 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 shadow-sm'
                  }`}
                  style={{ color: currentPage === 1 ? '#9CA3AF' : '#1F2937' }}
                >
                  上一页
                </button>
                
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-md text-sm font-bold transition-all shadow-sm ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white scale-105'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100'
                      }`}
                      style={{ color: currentPage === i + 1 ? '#FFFFFF' : '#1F2937' }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 shadow-sm'
                  }`}
                  style={{ color: currentPage === totalPages ? '#9CA3AF' : '#1F2937' }}
                >
                  下一页
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
