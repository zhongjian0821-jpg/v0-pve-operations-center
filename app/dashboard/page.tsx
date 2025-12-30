'use client';

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface DashboardCard {
  icon: string;
  title: string;
  description: string;
  link: string;
  badge?: number | null;
  color: string;
  note?: string;
}

interface Section {
  id: string;
  title: string;
  cards: DashboardCard[];
  isNew?: boolean;
}

export default function DashboardOptimized() {
  const sections: Section[] = [
    {
      id: 'core',
      title: 'PVE 核心功能',
      cards: [
        {
          icon: '🖥️',
          title: '节点管理',
          description: '管理区块链节点',
          link: '/nodes',
          badge: null,
          color: 'blue'
        },
        {
          icon: '💰',
          title: '钱包管理',
          description: '管理用户钱包',
          link: '/wallet',
          badge: null,
          color: 'yellow'
        },
        {
          icon: '💵',
          title: '收益中心',
          description: '统一收益管理 (整合版)',
          link: '/earnings',
          badge: null,
          color: 'green',
          note: '节点收益 + 佣金收益 + 分配记录'
        },
        {
          icon: '👥',
          title: '团队中心',
          description: '团队和推荐管理 (整合版)',
          link: '/team',
          badge: 32,
          color: 'green',
          note: '层级关系 + 推荐链接'
        },
        {
          icon: '💎',
          title: '佣金中心',
          description: '佣金管理和分配 (整合版)',
          link: '/commissions',
          badge: 10,
          color: 'yellow',
          note: '佣金记录 + 佣金分配'
        },
        {
          icon: '🛒',
          title: '转让市场',
          description: '节点买卖交易 (整合版)',
          link: '/marketplace',
          badge: null,
          color: 'purple',
          note: '市场 + 挂单 + 交易记录'
        }
      ]
    },
    {
      id: 'management',
      title: '系统管理',
      cards: [
        {
          icon: '📦',
          title: '订单管理',
          description: '查看和管理订单',
          link: '/orders',
          badge: null,
          color: 'orange'
        },
        {
          icon: '📊',
          title: '交易记录',
          description: '查看所有交易',
          link: '/transactions',
          badge: 0,
          color: 'blue'
        },
        {
          icon: '💸',
          title: '提现管理',
          description: '处理提现申请',
          link: '/withdrawals',
          badge: null,
          color: 'red'
        },
        {
          icon: '⭐',
          title: '会员等级',
          description: '会员等级配置',
          link: '/member-levels',
          badge: null,
          color: 'yellow'
        },
        {
          icon: '📋',
          title: '操作日志',
          description: '系统操作记录',
          link: '/operation-logs',
          badge: null,
          color: 'gray'
        },
        {
          icon: '🔐',
          title: '登录日志',
          description: '查看登录日志',
          link: '/login-logs',
          badge: null,
          color: 'gray'
        }
      ]
    },
    {
      id: 'advanced',
      title: '高级功能',
      isNew: true,
      cards: [
        {
          icon: '☁️',
          title: '云托管管理',
          description: '云服务管理',
          link: '/cloud-hosting',
          badge: null,
          color: 'blue'
        },
        {
          icon: '⚓',
          title: '质押记录',
          description: '质押管理',
          link: '/staking-records',
          badge: null,
          color: 'purple'
        },
        {
          icon: '⚙️',
          title: '用户配置',
          description: '个人设置中心',
          link: '/profile',
          badge: null,
          color: 'gray'
        }
      ]
    }
  ];

  const getColorClass = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'hover:border-blue-500 hover:shadow-blue-100',
      yellow: 'hover:border-yellow-500 hover:shadow-yellow-100',
      green: 'hover:border-green-500 hover:shadow-green-100',
      purple: 'hover:border-purple-500 hover:shadow-purple-100',
      orange: 'hover:border-orange-500 hover:shadow-orange-100',
      red: 'hover:border-red-500 hover:shadow-red-100',
      gray: 'hover:border-gray-500 hover:shadow-gray-100'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* 头部 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PVE运营中心</h1>
          <p className="text-gray-600 mt-1">欢迎回来，admin</p>
        </div>
        <button className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
          退出登录
        </button>
      </div>

      {/* 优化提示 */}
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">✨</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">页面已优化</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• 整合了4个核心模块（收益、佣金、团队、市场），每个模块现在都有标签页</p>
              <p>• 删除了重复功能，从18个卡片优化到15个</p>
              <p>• 点击带有"整合版"标记的卡片可查看增强功能</p>
            </div>
          </div>
        </div>
      </div>

      {/* 各个功能区 */}
      {sections.map(section => (
        <div key={section.id} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-800">{section.title}</h2>
            {section.isNew && (
              <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded font-bold">
                NEW
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.cards.map(card => (
              <Link key={card.title} href={card.link}>
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${getColorClass(card.color)} border-2`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{card.icon}</span>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {card.title}
                            </h3>
                            {card.badge !== null && card.badge !== undefined && (
                              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                                {card.badge}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                        {card.note && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            💡 {card.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* 已移除功能说明 */}
      <div className="mt-8 bg-gray-100 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-3">🗑️ 已移除的重复功能</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span>❌</span>
            <span><strong>分配记录</strong> - 已整合到 <Link href="/earnings" className="text-blue-600 hover:underline">收益中心</Link> 的"分配记录"标签</span>
          </div>
          <div className="flex items-start gap-2">
            <span>❌</span>
            <span><strong>佣金分配</strong> - 已整合到 <Link href="/commissions" className="text-blue-600 hover:underline">佣金中心</Link> 的"佣金分配"标签</span>
          </div>
          <div className="flex items-start gap-2">
            <span>❌</span>
            <span><strong>佣金记录</strong> - 已整合到 <Link href="/commissions" className="text-blue-600 hover:underline">佣金中心</Link> 的"佣金记录"标签</span>
          </div>
          <div className="flex items-start gap-2">
            <span>❌</span>
            <span><strong>层级关系</strong> - 已整合到 <Link href="/team" className="text-blue-600 hover:underline">团队中心</Link> 的"团队层级"标签</span>
          </div>
        </div>
      </div>
    </div>
  );
}
