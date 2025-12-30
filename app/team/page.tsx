'use client';
// Rebuild: 1767113199

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

  // 获取某个地址的所有直推下级
  const getDirectChildren = (parentAddress: string): Member[] => {
    return members.filter(m => 
      m.parent_wallet && 
      m.parent_wallet.toLowerCase() === parentAddress.toLowerCase()
    );
  };

  // 切换展开/收起
  const toggleExpand = (address: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedMembers(newExpanded);
  };

  // 获取等级名称和颜色
  const getLevelInfo = (level: string) => {
    const info: { [key: string]: { name: string; color: string; bgColor: string } } = {
      'global_partner': { name: '全球合伙人', color: 'text-orange-800', bgColor: 'bg-orange-100' },
      'market_partner': { name: '市场合伙人', color: 'text-purple-800', bgColor: 'bg-purple-100' },
      'normal': { name: '普通会员', color: 'text-green-800', bgColor: 'bg-green-100' },
    };
    return info[level] || info['normal'];
  };

  // 格式化余额
  const formatBalance = (balance: string) => {
    return parseFloat(balance).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // 渲染成员卡片（展开后显示）
  const renderMemberCard = (member: Member, level: number = 0) => {
    const children = getDirectChildren(member.wallet_address);
    const isExpanded = expandedMembers.has(member.wallet_address);
    const hasChildren = children.length > 0;
    const levelInfo = getLevelInfo(member.member_level);

    return (
      <div key={member.id} className="relative">
        {/* 成员卡片 */}
        <div 
          className={`relative bg-white border-l-4 ${
            member.member_level === 'global_partner' ? 'border-orange-500' :
            member.member_level === 'market_partner' ? 'border-purple-500' :
            'border-green-500'
          } rounded-lg shadow-sm mb-3 overflow-hidden hover:shadow-md transition-shadow`}
          style={{ marginLeft: `${level * 40}px` }}
        >
          <div className="p-4">
            {/* 顶部：地址和操作 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* 展开按钮 */}
                {hasChildren && (
                  <button
                    onClick={() => toggleExpand(member.wallet_address)}
                    className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 font-bold"
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                )}
                
                {/* 钱包地址 */}
                <div>
                  <div className="text-lg font-mono font-bold text-gray-900">
                    {member.wallet_address.substring(0, 8)}...{member.wallet_address.substring(member.wallet_address.length - 6)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    加入时间: {new Date(member.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>

              {/* 等级标签 */}
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${levelInfo.bgColor} ${levelInfo.color}`}>
                {levelInfo.name}
              </span>
            </div>

            {/* 数据网格 */}
            <div className="grid grid-cols-3 gap-4">
              {/* ASHVA余额 */}
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">ASHVA余额</div>
                <div className="text-lg font-bold text-blue-700">
                  {formatBalance(member.ashva_balance)}
                </div>
              </div>

              {/* 总收益 */}
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-600 font-medium mb-1">总收益</div>
                <div className="text-lg font-bold text-green-700">
                  {formatBalance(member.total_earnings)}
                </div>
              </div>

              {/* 团队人数 */}
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-purple-600 font-medium mb-1">团队人数</div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-purple-700">
                    {member.team_size}
                  </div>
                  {hasChildren && (
                    <button
                      onClick={() => toggleExpand(member.wallet_address)}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      (直推{children.length}人)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 递归显示下级（如果展开） */}
        {isExpanded && hasChildren && (
          <div className="ml-6 border-l-2 border-gray-200 pl-2">
            {children.map(child => renderMemberCard(child, level + 1))}
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

  // 顶级成员（没有上级的）+ 有下级的成员
  const membersWithChildren = members.filter(m => {
    const children = getDirectChildren(m.wallet_address);
    return children.length > 0;
  });

  // 如果没有上级的成员很少，就显示所有有下级的成员
  const topMembers = members.filter(m => !m.parent_wallet);
  const displayMembers = topMembers.length > 0 ? topMembers : membersWithChildren.slice(0, 10);

  // 统计数据
  const totalMembers = members.length;
  const normalMembers = members.filter(m => m.member_level === 'normal').length;
  const marketPartners = members.filter(m => m.member_level === 'market_partner').length;
  const globalPartners = members.filter(m => m.member_level === 'global_partner').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">团队中心 🌳</h1>
          <p className="text-gray-600">点击 <span className="font-bold text-blue-600">+ 按钮</span> 或 <span className="font-bold text-purple-600">团队人数</span> 展开查看该成员推荐的所有下级</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-600 mb-2">团队总人数</div>
            <div className="text-4xl font-bold text-blue-600">{totalMembers}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-600 mb-2">普通会员</div>
            <div className="text-4xl font-bold text-green-600">{normalMembers}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-600 mb-2">市场合伙人</div>
            <div className="text-4xl font-bold text-purple-600">{marketPartners}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-600 mb-2">全球合伙人</div>
            <div className="text-4xl font-bold text-orange-600">{globalPartners}</div>
          </div>
        </div>

        {/* 团队树状结构 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">团队层级结构</h2>
            <div className="text-sm text-gray-600">
              显示 {displayMembers.length} 个顶级/核心成员
            </div>
          </div>

          {displayMembers.length > 0 ? (
            <div className="space-y-4">
              {displayMembers.map(member => renderMemberCard(member, 0))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-500 text-lg">暂无团队成员数据</div>
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">💡 使用说明</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><span className="font-bold">点击 + 按钮</span> 或 <span className="font-bold">团队人数</span> 可以展开查看该成员直推的所有下级</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><span className="font-bold">层级缩进</span> 显示推荐关系：右侧缩进的是左侧成员推荐的下级</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><span className="font-bold">可以递归展开</span> 多层级，查看整个团队网络</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><span className="font-bold">边框颜色</span> 表示会员等级：<span className="text-orange-600">橙色=全球合伙人</span>，<span className="text-purple-600">紫色=市场合伙人</span>，<span className="text-green-600">绿色=普通会员</span></span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
