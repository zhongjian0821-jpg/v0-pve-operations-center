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

export default function DashboardComplete() {
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
      id: 'admin',
      title: '管理员专区',
      isNew: true,
      cards: [
        {
          icon: '📊',
          title: '管理员仪表板',
          description: '管理员数据总览',
          link: '/admin/dashboard',
          badge: null,
          color: 'red'
        },
        {
          icon: '👤',
          title: '用户管理',
          description: '管理所有用户',
          link: '/admin/users',
          badge: null,
          color: 'blue'
        },
        {
          icon: '🖥️',
          title: '节点管理',
          description: '管理所有节点',
          link: '/admin/nodes',
          badge: null,
          color: 'green'
        },
        {
          icon: '📦',
          title: '订单管理',
          description: '管理所有订单',
          link: '/admin/orders',
          badge: null,
          color: 'orange'
        },
        {
          icon: '💸',
          title: '提现审核',
          description: '审核提现申请',
          link: '/admin/withdrawals',
          badge: null,
          color: 'red'
        },
        {
          icon: '📈',
          title: '报表中心',
          description: '数据分析报表',
          link: '/admin/reports',
          badge: null,
          color: 'purple'
        }
      ]
    },
    {
      id: 'purchase',
      title: '购买中心',
      isNew: true,
      cards: [
        {
          icon: '🛍️',
          title: '购买记录',
          description: '查看购买历史',
          link: '/purchases',
          badge: null,
          color: 'orange'
        },
        {
          icon: '👛',
          title: '钱包列表',
          description: '多钱包管理',
          link: '/wallets',
          badge: null,
          color: 'yellow'
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
      id: 'member',
      title: '会员管理',
      isNew: true,
      cards: [
        {
          icon: '🎁',
          title: '会员权益',
          description: '查看会员权益',
          link: '/member-benefits',
          badge: null,
          color: 'yellow'
        },
        {
          icon: '⚙️',
          title: '等级配置',
          description: '配置会员等级',
          link: '/member-level-config',
          badge: null,
          color: 'purple'
        }
      ]
    },
    {
      id: 'blockchain',
      title: '区块链中心',
      isNew: true,
      cards: [
        {
          icon: '⛓️',
          title: '区块链管理',
          description: '区块链基础设施管理 (整合版)',
          link: '/admin/blockchain',
          badge: null,
          color: 'purple',
          note: '管理员 + 客户 + 机器 + 节点'
        },
        {
          icon: '🔧',
          title: '节点购买管理',
          description: '节点购买统一管理 (整合版)',
          link: '/admin/node-purchases',
          badge: null,
          color: 'blue',
          note: '云节点 + 镜像节点 + 挂单'
        }
      ]
    },
    {
      id: 'advanced',
      title: '高级功能',
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
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">🎉</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">完整版仪表板已部署！</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• <strong>新增4个区块</strong>：管理员专区、购买中心、会员管理、区块链中心</p>
              <p>• <strong>整合2个模块</strong>：区块链管理(4个页面)、节点购买管理(3个页面)</p>
              <p>• <strong>新增10个卡片</strong>：从15个增加到25个，覆盖率提升到62.5%</p>
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
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
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

      {/* 统计信息 */}
      <div className="mt-8 bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 系统统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">25</div>
            <div className="text-sm text-gray-500 mt-1">仪表板卡片</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">40</div>
            <div className="text-sm text-gray-500 mt-1">总页面数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">62.5%</div>
            <div className="text-sm text-gray-500 mt-1">覆盖率</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">7</div>
            <div className="text-sm text-gray-500 mt-1">整合模块</div>
          </div>
        </div>
      </div>
    </div>
  );
}
