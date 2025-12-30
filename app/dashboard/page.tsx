'use client';
// Force rebuild at 1767100021

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DashboardCard {
  icon: string;
  title: string;
  description: string;
  link: string;
  badge?: number;
  color: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ members: 36, nodes: 0, orders: 0 });

  useEffect(() => {
    // 获取实时统计
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(prev => ({ ...prev, members: data.data.total || 36 }));
        }
      })
      .catch(() => {});
  }, []);

  const sections = [
    {
      title: '会员管理',
      cards: [
        {
          icon: '👥',
          title: '会员管理',
          description: '查看和管理所有会员信息',
          link: '/admin/members',
          badge: stats.members,
          color: 'from-blue-500 to-blue-600'
        },
        {
          icon: '🌳',
          title: '团队中心',
          description: '团队层级关系和推荐管理',
          link: '/team',
          badge: 32,
          color: 'from-green-500 to-green-600'
        },
        {
          icon: '👤',
          title: '用户管理',
          description: '管理系统用户和权限',
          link: '/admin/users',
          color: 'from-purple-500 to-purple-600'
        }
      ]
    },
    {
      title: '财务管理',
      cards: [
        {
          icon: '💰',
          title: '钱包管理',
          description: '管理用户钱包和余额',
          link: '/wallet',
          color: 'from-yellow-500 to-yellow-600'
        },
        {
          icon: '💎',
          title: '佣金中心',
          description: '佣金管理和分配记录',
          link: '/commissions',
          badge: 10,
          color: 'from-amber-500 to-amber-600'
        },
        {
          icon: '💵',
          title: '收益中心',
          description: '节点收益和佣金收益',
          link: '/earnings',
          color: 'from-emerald-500 to-emerald-600'
        },
        {
          icon: '🏦',
          title: '提现管理',
          description: '管理用户提现申请',
          link: '/admin/withdrawals',
          color: 'from-cyan-500 to-cyan-600'
        }
      ]
    },
    {
      title: '节点与交易',
      cards: [
        {
          icon: '🖥️',
          title: '节点管理',
          description: '管理区块链节点',
          link: '/nodes',
          color: 'from-indigo-500 to-indigo-600'
        },
        {
          icon: '📦',
          title: '订单管理',
          description: '管理所有订单',
          link: '/admin/orders',
          badge: stats.orders,
          color: 'from-blue-500 to-blue-600'
        },
        {
          icon: '🛒',
          title: '转让市场',
          description: '节点买卖交易市场',
          link: '/marketplace',
          color: 'from-pink-500 to-pink-600'
        },
        {
          icon: '📝',
          title: '节点列表',
          description: '查看和管理用户节点',
          link: '/admin/node-purchases',
          color: 'from-violet-500 to-violet-600'
        }
      ]
    },
    {
      title: '系统管理',
      cards: [
        {
          icon: '📊',
          title: '数据总览',
          description: '查看系统数据统计',
          link: '/admin/dashboard',
          color: 'from-red-500 to-red-600'
        },
        {
          icon: '⛓️',
          title: '区块链管理',
          description: '区块链配置和监控',
          link: '/admin/blockchain',
          color: 'from-slate-500 to-slate-600'
        },
        {
          icon: '📈',
          title: '报表中心',
          description: '数据分析和报表',
          link: '/admin/reports',
          color: 'from-orange-500 to-orange-600'
        },
        {
          icon: '📋',
          title: '交易记录',
          description: '查看所有交易历史',
          link: '/admin/transaction-logs',
          color: 'from-teal-500 to-teal-600'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PVE运营中心</h1>
          <p className="text-gray-600">欢迎回来，admin</p>
        </div>

        {/* 功能模块 */}
        {sections.map((section, idx) => (
          <div key={idx} className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              {section.title}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {section.cards.map((card, cardIdx) => (
                <Link key={cardIdx} href={card.link}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    
                    <CardContent className="p-6 relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`text-4xl bg-gradient-to-br ${card.color} bg-clip-text`}>
                          {card.icon}
                        </div>
                        {card.badge !== undefined && card.badge > 0 && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-br ${card.color}`}>
                            {card.badge}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {card.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {card.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* 页脚 */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>数据实时更新于: {new Date().toLocaleString('zh-CN')}</p>
        </div>
      </div>
    </div>
  );
}
