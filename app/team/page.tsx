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

interface CommissionSettings {
  address: string;
  memberLevel: string;
  maxDepth: number;
  totalCommission: number;
  extraRewardRight: number;
  selfRate: number;
  level1Rate: number;
  level2Rate: number;
  level1Extra: number;
  level2Extra: number;
  marketPartnerRate?: number;
  marketPartnerExtra?: number;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [commissionsCache, setCommissionsCache] = useState<Map<string, CommissionSettings>>(new Map());
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

  const fetchCommissionSettings = async (address: string): Promise<CommissionSettings | null> => {
    // 检查缓存
    if (commissionsCache.has(address)) {
      return commissionsCache.get(address)!;
    }

    try {
      const response = await fetch(`/api/commission-settings?address=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setCommissionsCache(prev => new Map(prev).set(address, data.data));
        return data.data;
      }
    } catch (err) {
      console.error('Error fetching commission:', err);
    }
    
    return null;
  };

  const getDirectChildren = (parentAddress: string): Member[] => {
    return members.filter(m => 
      m.parent_wallet && 
      m.parent_wallet.toLowerCase() === parentAddress.toLowerCase()
    );
  };

  const getAllDescendants = (parentAddress: string): Member[] => {
    const direct = getDirectChildren(parentAddress);
    let all = [...direct];
    
    for (const child of direct) {
      const descendants = getAllDescendants(child.wallet_address);
      all = [...all, ...descendants];
    }
    
    return all;
  };

  const toggleExpand = async (address: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
      // 预加载佣金设置
      await fetchCommissionSettings(address);
    }
    setExpandedMembers(newExpanded);
  };

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
      setExpandedMembers(new Set([found.wallet_address]));
    } else {
      setSearchResult(null);
      alert('未找到该钱包地址');
    }
  };

  const getLevelInfo = (level: string) => {
    const info: { [key: string]: { name: string; color: string; bgColor: string; maxDepth: number } } = {
      'global_partner': { name: '全球合伙人', color: 'text-orange-800', bgColor: 'bg-orange-100', maxDepth: 100 },
      'market_partner': { name: '市场合伙人', color: 'text-purple-800', bgColor: 'bg-purple-100', maxDepth: 20 },
      'normal': { name: '普通会员', color: 'text-green-800', bgColor: 'bg-green-100', maxDepth: 2 },
    };
    return info[level] || info['normal'];
  };

  const formatBalance = (balance: string) => {
    return parseFloat(balance).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const CommissionDisplay = ({ settings, compact = false }: { settings: CommissionSettings; compact?: boolean }) => {
    if (compact) {
      return (
        <div className="text-xs text-gray-600">
          <span className="font-semibold">佣金设置:</span>{' '}
          直推{settings.level1Rate}% / 间推{settings.level2Rate}%
          {settings.marketPartnerRate && ` / 市场${settings.marketPartnerRate}%`}
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
        <div className="text-sm font-bold text-blue-900 mb-2">💰 佣金分配设置</div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white rounded p-2">
            <div className="text-gray-600 mb-1">最大层级</div>
            <div className="text-lg font-bold text-blue-600">{settings.maxDepth}级</div>
          </div>
          
          <div className="bg-white rounded p-2">
            <div className="text-gray-600 mb-1">总佣金</div>
            <div className="text-lg font-bold text-green-600">{settings.totalCommission}%</div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {settings.memberLevel === 'global_partner' && settings.marketPartnerRate && (
            <div className="flex justify-between items-center py-1.5 border-b border-blue-100">
              <span className="text-cyan-700 font-medium">市场合伙人</span>
              <span className="font-bold text-cyan-700">
                {settings.marketPartnerRate}%
                {settings.marketPartnerExtra! > 0 && (
                  <span className="text-xs text-green-600 ml-1">
                    (10% + {settings.marketPartnerExtra}%↑)
                  </span>
                )}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center py-1.5 border-b border-blue-100">
            <span className="text-blue-700 font-medium">直推</span>
            <span className="font-bold text-blue-700">
              {settings.level1Rate}%
              {settings.level1Extra > 0 && (
                <span className="text-xs text-green-600 ml-1">
                  (3% + {settings.level1Extra}%↑)
                </span>
              )}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-1.5 border-b border-blue-100">
            <span className="text-purple-700 font-medium">间推</span>
            <span className="font-bold text-purple-700">
              {settings.level2Rate}%
              {settings.level2Extra > 0 && (
                <span className="text-xs text-green-600 ml-1">
                  (2% + {settings.level2Extra}%↑)
                </span>
              )}
            </span>
          </div>

          {settings.extraRewardRight > 0 && (
            <div className="flex justify-between items-center py-1.5 bg-amber-50 rounded px-2">
              <span className="text-amber-700 font-medium">自己保留</span>
              <span className="font-bold text-amber-700">{settings.selfRate}%</span>
            </div>
          )}
        </div>

        {settings.extraRewardRight > 0 && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
            <span className="font-semibold">额外收益权:</span> {settings.extraRewardRight}% 
            (已分配 {(settings.level1Extra + settings.level2Extra + 
              (settings.marketPartnerExtra || 0) + settings.selfRate).toFixed(1)}%)
          </div>
        )}
      </div>
    );
  };

  const renderMemberCard = (member: Member, level: number = 0, isSearchResult: boolean = false) => {
    const children = getDirectChildren(member.wallet_address);
    const allDescendants = getAllDescendants(member.wallet_address);
    const isExpanded = expandedMembers.has(member.wallet_address);
    const hasChildren = children.length > 0;
    const levelInfo = getLevelInfo(member.member_level);
    
    // 计算直推和间推
    const directCount = children.length;
    const indirectCount = allDescendants.length - directCount;
    
    // 获取佣金设置
    const [commissionSettings, setCommissionSettings] = useState<CommissionSettings | null>(
      commissionsCache.get(member.wallet_address) || null
    );

    useEffect(() => {
      if (isExpanded && !commissionSettings) {
        fetchCommissionSettings(member.wallet_address).then(setCommissionSettings);
      }
    }, [isExpanded]);

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
                <div className="text-xs text-purple-600 font-medium mb-1">团队结构</div>
                <div className="flex flex-col">
                  <div className="text-sm font-bold text-purple-700">
                    总{allDescendants.length}人
                  </div>
                  {hasChildren && (
                    <div className="text-xs text-gray-600">
                      直推{directCount} / 间推{indirectCount}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 层级限制提示 */}
            <div className="mt-3 bg-gray-50 rounded-lg p-2 text-xs text-gray-700">
              <span className="font-semibold">可发展层级:</span> 最多{levelInfo.maxDepth}级
              {member.member_level === 'normal' && <span className="text-orange-600 ml-2">⚠️ 只能发展2级</span>}
              {member.member_level === 'market_partner' && <span className="text-blue-600 ml-2">✓ 可发展20级</span>}
              {member.member_level === 'global_partner' && <span className="text-green-600 ml-2">✓ 可发展100级</span>}
            </div>

            {/* 佣金设置显示 */}
            {isExpanded && commissionSettings && (
              <CommissionDisplay settings={commissionSettings} />
            )}
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

  const searchStats = searchResult ? (() => {
    const allDescendants = getAllDescendants(searchResult.wallet_address);
    const directChildren = getDirectChildren(searchResult.wallet_address);
    const totalBalance = allDescendants.reduce((sum, m) => sum + parseFloat(m.ashva_balance), 0);
    
    return {
      directCount: directChildren.length,
      indirectCount: allDescendants.length - directChildren.length,
      totalCount: allDescendants.length,
      totalBalance: totalBalance,
      levels: {
        normal: allDescendants.filter(m => m.member_level === 'normal').length,
        market: allDescendants.filter(m => m.member_level === 'market_partner').length,
        global: allDescendants.filter(m => m.member_level === 'global_partner').length,
      }
    };
  })() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">团队中心 🌳</h1>
          <p className="text-gray-600">搜索会员查看完整团队网络和佣金设置</p>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">直推人数</div>
                <div className="text-3xl font-bold text-blue-600">{searchStats.directCount}</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">间推人数</div>
                <div className="text-3xl font-bold text-purple-600">{searchStats.indirectCount}</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">团队总人数</div>
                <div className="text-3xl font-bold text-green-600">{searchStats.totalCount}</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">团队总余额</div>
                <div className="text-2xl font-bold text-orange-600">
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
              <div className="text-xs text-gray-500 mt-1">最多2级</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-2">市场合伙人</div>
              <div className="text-4xl font-bold text-purple-600">{marketPartners}</div>
              <div className="text-xs text-gray-500 mt-1">最多20级</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-2">全球合伙人</div>
              <div className="text-4xl font-bold text-orange-600">{globalPartners}</div>
              <div className="text-xs text-gray-500 mt-1">最多100级</div>
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
            <li>• <span className="font-bold">搜索功能</span>：输入钱包地址查找会员，查看完整团队和佣金设置</li>
            <li>• <span className="font-bold">团队统计</span>：显示直推、间推人数和团队总余额</li>
            <li>• <span className="font-bold">佣金设置</span>：点击 + 展开查看会员的完整佣金分配设置</li>
            <li>• <span className="font-bold">层级限制</span>：普通会员2级 / 市场合伙人20级 / 全球合伙人100级</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
