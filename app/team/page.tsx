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
  const [childrenCache, setChildrenCache] = useState<Map<string, Member[]>>(new Map());

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

  // 获取某个地址的直推下级
  const getChildren = (parentAddress: string): Member[] => {
    if (childrenCache.has(parentAddress)) {
      return childrenCache.get(parentAddress) || [];
    }
    
    const children = members.filter(m => 
      m.parent_wallet && m.parent_wallet.toLowerCase() === parentAddress.toLowerCase()
    );
    
    setChildrenCache(new Map(childrenCache.set(parentAddress, children)));
    return children;
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

  // 获取等级名称
  const getLevelName = (level: string) => {
    const levels: { [key: string]: string } = {
      'normal': '普通会员',
      'market_partner': '市场合伙人',
      'global_partner': '全球合伙人',
    };
    return levels[level] || '普通会员';
  };

  // 获取等级颜色
  const getLevelColor = (level: string) => {
    if (level === 'global_partner') return 'bg-orange-100 text-orange-800';
    if (level === 'market_partner') return 'bg-purple-100 text-purple-800';
    return 'bg-green-100 text-green-800';
  };

  // 渲染成员行
  const renderMemberRow = (member: Member, level: number = 0) => {
    const children = getChildren(member.wallet_address);
    const isExpanded = expandedMembers.has(member.wallet_address);
    const hasChildren = children.length > 0;

    return (
      <div key={member.id}>
        {/* 成员信息行 */}
        <div 
          className={`flex items-center p-4 border-b border-gray-200 hover:bg-gray-50 ${
            level > 0 ? 'bg-gray-50' : 'bg-white'
          }`}
          style={{ paddingLeft: `${level * 40 + 16}px` }}
        >
          {/* 展开/收起按钮 */}
          <div className="w-8 flex-shrink-0">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(member.wallet_address)}
                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
          </div>

          {/* 钱包地址 */}
          <div className="flex-1 min-w-[150px]">
            <div className="text-sm font-mono text-blue-600 font-medium">
              {member.wallet_address.substring(0, 6)}...
              {member.wallet_address.substring(member.wallet_address.length - 4)}
            </div>
          </div>

          {/* 等级 */}
          <div className="w-32 flex-shrink-0">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(member.member_level)}`}>
              {getLevelName(member.member_level)}
            </span>
          </div>

          {/* ASHVA余额 */}
          <div className="w-40 flex-shrink-0 text-right">
            <div className="text-sm font-semibold text-gray-900">
              {parseFloat(member.ashva_balance).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
            <div className="text-xs text-gray-500">ASHVA</div>
          </div>

          {/* 总收益 */}
          <div className="w-40 flex-shrink-0 text-right">
            <div className="text-sm font-semibold text-green-600">
              {parseFloat(member.total_earnings).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
            <div className="text-xs text-gray-500">总收益</div>
          </div>

          {/* 团队人数（可点击） */}
          <div className="w-32 flex-shrink-0 text-center">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(member.wallet_address)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium text-sm"
              >
                {member.team_size} 人
              </button>
            ) : (
              <span className="text-sm text-gray-500">{member.team_size} 人</span>
            )}
          </div>

          {/* 加入时间 */}
          <div className="w-32 flex-shrink-0 text-right text-sm text-gray-600">
            {new Date(member.created_at).toLocaleDateString('zh-CN')}
          </div>
        </div>

        {/* 递归显示下级 */}
        {isExpanded && children.length > 0 && (
          <div>
            {children.map(child => renderMemberRow(child, level + 1))}
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

  // 只显示顶级成员（没有上级的）
  const topLevelMembers = members.filter(m => !m.parent_wallet);
  
  // 统计数据
  const totalMembers = members.length;
  const normalMembers = members.filter(m => m.member_level === 'normal').length;
  const marketPartners = members.filter(m => m.member_level === 'market_partner').length;
  const globalPartners = members.filter(m => m.member_level === 'global_partner').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">团队中心</h1>
        <p className="text-gray-600 mb-8">查看团队层级结构和成员详情（点击团队人数展开下级）</p>

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

        {/* 团队树状结构 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 表头 */}
          <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center font-semibold text-sm text-gray-700">
            <div className="w-8 flex-shrink-0"></div>
            <div className="flex-1 min-w-[150px]">钱包地址</div>
            <div className="w-32 flex-shrink-0">会员等级</div>
            <div className="w-40 flex-shrink-0 text-right">ASHVA余额</div>
            <div className="w-40 flex-shrink-0 text-right">总收益</div>
            <div className="w-32 flex-shrink-0 text-center">团队人数</div>
            <div className="w-32 flex-shrink-0 text-right">加入时间</div>
          </div>

          {/* 成员列表 */}
          <div className="max-h-[600px] overflow-y-auto">
            {topLevelMembers.length > 0 ? (
              topLevelMembers.map(member => renderMemberRow(member, 0))
            ) : (
              <div className="p-12 text-center text-gray-500">
                暂无团队成员数据
              </div>
            )}
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-4 text-sm text-gray-600">
          <p>💡 提示：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>点击团队人数或展开按钮查看下级成员</li>
            <li>层级缩进显示上下级关系</li>
            <li>当前显示所有顶级会员（没有上级的会员）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
