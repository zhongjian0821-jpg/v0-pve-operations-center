'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
          badge: 36,
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
          description: '查看所有会员钱包',
          link: '/wallets',
          color: 'from-yellow-500 to-yellow-600'
        },
        {
          icon: '💎',
          title: '佣金中心',
          description: '佣金管理和分配',
          link: '/commissions',
          badge: 10,
          color: 'from-amber-500 to-amber-600'
        },
        {
          icon: '💵',
          title: '收益中心',
          description: '节点收益和佣金',
          link: '/earnings',
          color: 'from-emerald-500 to-emerald-600'
        },
        {
          icon: '🏦',
          title: '提现管理',
          description: '提现申请处理',
          link: '/withdrawals',
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
          description: '查看所有订单',
          link: '/orders',
          color: 'from-blue-500 to-blue-600'
        },
        {
          icon: '🛒',
          title: '转让市场',
          description: '节点转让交易',
          link: '/marketplace',
          color: 'from-pink-500 to-pink-600'
        },
        {
          icon: '📝',
          title: '产品中心',
          description: '产品中心记录',
          link: '/products',
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
          description: '系统数据统计',
          link: '/admin/dashboard',
          color: 'from-red-500 to-red-600'
        },
        {
          icon: '⛓️',
          title: '区块链配置',
          description: '区块链设置',
          link: '/admin/blockchain',
          color: 'from-slate-500 to-slate-600'
        },
        {
          icon: '📈',
          title: '报表中心',
          description: '数据分析报表',
          link: '/admin/reports',
          color: 'from-orange-500 to-orange-600'
        },
        {
          icon: '📋',
          title: '交易记录',
          description: '所有交易历史',
          link: '/transactions',
          color: 'from-teal-500 to-teal-600'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PVE运营中心</h1>
          <p className="text-gray-600">欢迎回来，admin</p>
        </div>

        {sections.map((section, sectionIndex) => (
          <div key={`section-${sectionIndex}`} className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {section.title}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {section.cards.map((card, cardIndex) => (
                <a
                  key={`card-${sectionIndex}-${cardIndex}`}
                  href={card.link}
                  className="block bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 relative overflow-hidden group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">
                        {card.icon}
                      </div>
                      {card.badge && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-br ${card.color}`}>
                          {card.badge}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {card.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {card.description}
                    </p>
                    
                    <p className="text-xs font-mono text-blue-500 bg-blue-50 px-2 py-1 rounded">
                      → {card.link}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 text-center text-sm text-gray-600">
          {mounted ? (
            <p>数据实时更新于: {new Date().toLocaleString('zh-CN')}</p>
          ) : (
            <p>数据实时更新于: 加载中...</p>
          )}
        </div>
      </div>
    </div>
  );
}
