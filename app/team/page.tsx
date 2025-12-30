'use client';

import { useEffect, useState } from 'react';

interface Member {
  id: number;
  wallet_address: string;
  ashva_balance: string;
  member_level: string;
  parent_wallet: string | null;
  team_size: number;
  total_earnings: string;
  created_at: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [showMode, setShowMode] = useState<'all' | 'top'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<Member | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      
      if (data.success && data.data) {
        const memberList = data.data.items || data.data || [];
        setMembers(Array.isArray(memberList) ? memberList : []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setMembers([]);
      setLoading(false);
    }
  };

  const getDirectChildren = (parentAddress: string): Member[] => {
    return members.filter(m => 
      m.parent_wallet && 
      m.parent_wallet.toLowerCase() === parentAddress.toLowerCase()
    );
  };

  // 获取所有下级（递归）
  const getAllDescendants = (parentAddress: string): Member[] => {
    const direct = getDirectChildren(parentAddress);
    let all = [...direct];
    
    for (const child of direct) {
      const descendants = getAllDescendants(child.wallet_address);
      all = [...all, ...descendants];
    }
    
    return all;
  };

  const toggleExpand = (address: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedMembers(newExpanded);
  };

  // 搜索功能
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResult(null);
      return;
    }

    const found = members.find(m => 
      m.wallet_address.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    if (found) {
      setSearchResult(found);
      // 自动展开这个会员
      setExpandedMembers(new Set([found.wallet_address]));
    } else {
      setSearchResult(null);
      alert('未找到该钱包地址');
    }
  };

  const getLevelInfo = (level: string) => {
    const info: { [key: string]: { name: string; color: string; bgColor: string } } = {
      'global_partner': { name: '全球合伙人', color: 'text-orange-800', bgColor: 'bg-orange-100' },
      'market_partner': { name: '市场合伙人', color: 'text-purple-800', bgColor: 'bg-purple-100' },
      'normal': { name: '普通会员', color: 'text-green-800', bgColor: 'bg-green-100' },
    };
    return info[level] || info['normal'];
  };

  const formatBalance = (balance: string) => {
    return parseFloat(balance).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const renderMemberCard = (member: Member, level: number = 0, isSearchResult: boolean = false) => {
    const children = getDirectChildren(member.wallet_address);
    const isExpanded = expandedMembers.has(member.wallet_address);
    const hasChildren = children.length > 0;
    const levelInfo = getLevelInfo(member.member_level);

    return (
      <div key={member.id} className="relative">
        <div 
          className={`relative bg-white border-l-4 ${
            isSearchResult ? 'border-yellow-500 ring-2 ring-yellow-400' :
            member.member_level === 'global_partner' ? 'border-orange-500' :
            member.member_level === 'market_partner' ? 'border-purple-500' :
            'border-green-500'
          } rounded-lg shadow-sm mb-3 overflow-hidden hover:shadow-md transition-all`}
          style={{ marginLeft: `${level * 40}px` }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {hasChildren && (
                  <button
                    onClick={() => toggleExpand(member.wallet_address)}
                    className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 font-bold text-lg"
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                )}
                
                <div>
                  <div className="text-lg font-mono font-bold text-gray-900">
                    {member.wallet_address.substring(0, 8)}...{member.wallet_address.substring(member.wallet_address.length - 6)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    加入: {new Date(member.created_at).toLocaleDateString('zh-CN')}
                    {member.parent_wallet && (
                      <span className="ml-2">
                        上级: {member.parent_wallet.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSearchResult && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                    搜索结果
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${levelInfo.bgColor} ${levelInfo.color}`}>
                  {levelInfo.name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">ASHVA余额</div>
                <div className="text-lg font-bold text-blue-700">
                  {formatBalance(member.ashva_balance)}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-600 font-medium mb-1">总收益</div>
                <div className="text-lg font-bold text-green-700">
                  {formatBalance(member.total_earnings)}
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-purple-600 font-medium mb-1">团队</div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-purple-700">
                    {member.team_size}
                  </div>
                  {hasChildren && (
                    <button
                      onClick={() => toggleExpand(member.wallet_address)}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      (直推{children.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-6 border-l-2 border-gray-200 pl-2">
            {children.map(child => renderMemberCard(child, level + 1, false))}
          </div>
        )}
      </div>
    );
  };

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

  let displayMembers: Member[];
  
  if (searchResult) {
    displayMembers = [searchResult];
  } else if (showMode === 'top') {
    displayMembers = members.filter(m => !m.parent_wallet);
  } else {
    displayMembers = members.filter(m => {
      const children = getDirectChildren(m.wallet_address);
      return children.length > 0;
    });
  }

  const totalMembers = members.length;
  const normalMembers = members.filter(m => m.member_level === 'normal').length;
  const marketPartners = members.filter(m => m.member_level === 'market_partner').length;
  const globalPartners = members.filter(m => m.member_level === 'global_partner').length;

  // 如果有搜索结果，计算其下级统计
  let searchStats = null;
  if (searchResult) {
    const allDescendants = getAllDescendants(searchResult.wallet_address);
    const directChildren = getDirectChildren(searchResult.wallet_address);
    
    const totalBalance = allDescendants.reduce((sum, m) => sum + parseFloat(m.ashva_balance), 0);
    
    searchStats = {
      directCount: directChildren.length,
      totalCount: allDescendants.length,
      totalBalance: totalBalance,
      levels: {
        normal: allDescendants.filter(m => m.member_level === 'normal').length,
        market: allDescendants.filter(m => m.member_level === 'market_partner').length,
        global: allDescendants.filter(m => m.member_level === 'global_partner').length,
      }
    };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">团队中心 🌳</h1>
          <p className="text-gray-600">搜索会员查看其完整的下级网络</p>
        </div>

        {/* 搜索框 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="输入钱包地址搜索（支持部分匹配）..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
            >
              🔍 搜索
            </button>
            {searchResult && (
              <button
                onClick={() => {
                  setSearchResult(null);
                  setSearchTerm('');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                清除
              </button>
            )}
          </div>
        </div>

        {/* 搜索结果统计 */}
        {searchResult && searchStats && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-yellow-900 mb-4">
              📊 {searchResult.wallet_address.substring(0, 10)}... 的团队统计
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">直推人数</div>
                <div className="text-3xl font-bold text-blue-600">{searchStats.directCount}</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">团队总人数</div>
                <div className="text-3xl font-bold text-purple-600">{searchStats.totalCount}</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">团队总余额</div>
                <div className="text-2xl font-bold text-green-600">
                  {(searchStats.totalBalance / 1000000).toFixed(2)}M
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">等级分布</div>
                <div className="text-sm font-medium">
                  <span className="text-green-600">普{searchStats.levels.normal}</span> / 
                  <span className="text-purple-600"> 市{searchStats.levels.market}</span> / 
                  <span className="text-orange-600"> 全{searchStats.levels.global}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 全局统计 */}
        {!searchResult && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-2">团队总人数</div>
              <div className="text-4xl font-bold text-blue-600">{totalMembers}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-2">普通会员</div>
              <div className="text-4xl font-bold text-green-600">{normalMembers}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-2">市场合伙人</div>
              <div className="text-4xl font-bold text-purple-600">{marketPartners}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-2">全球合伙人</div>
              <div className="text-4xl font-bold text-orange-600">{globalPartners}</div>
            </div>
          </div>
        )}

        {/* 显示模式切换 */}
        {!searchResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-bold">显示模式：</span>
                {showMode === 'top' ? '只显示顶级会员' : '显示所有有下级的会员'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMode('top')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showMode === 'top'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  顶级会员 ({members.filter(m => !m.parent_wallet).length})
                </button>
                <button
                  onClick={() => setShowMode('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  所有推荐人 ({members.filter(m => getDirectChildren(m.wallet_address).length > 0).length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 团队列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchResult ? '搜索结果' : '团队成员'}
            </h2>
            <div className="text-sm text-gray-600">
              显示 {displayMembers.length} 个成员
            </div>
          </div>

          {displayMembers.length > 0 ? (
            <div className="space-y-4">
              {displayMembers.map(member => renderMemberCard(member, 0, member.id === searchResult?.id))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-500 text-lg">暂无符合条件的成员</div>
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">💡 使用说明</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• <span className="font-bold">搜索功能</span>：输入钱包地址（完整或部分）可以查找指定会员</li>
            <li>• <span className="font-bold">团队统计</span>：搜索后显示该会员的直推人数、团队总人数、团队总余额</li>
            <li>• <span className="font-bold">查看下级</span>：点击 + 按钮展开查看所有直推下级的详细信息</li>
            <li>• <span className="font-bold">递归展开</span>：可以继续展开下级的下级，查看完整的推荐网络</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
