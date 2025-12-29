'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MenuItem {
  title: string;
  path: string;
  description: string;
  icon: string;
  count?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [stats, setStats] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const adminData = localStorage.getItem('admin_user');
    
    if (!token || !adminData) {
      router.push('/login');
      return;
    }
    
    setAdmin(JSON.parse(adminData));
    fetchStats(token);
  }, [router]);

  const fetchStats = async (token: string) => {
    const endpoints = [
      'nodes', 'wallets', 'withdrawals', 'orders', 'transactions',
      'assigned-records', 'commission-records', 'hierarchy', 'member-level-config',
      'cloud-node-purchases', 'image-node-purchases', 'marketplace-listings',
      'marketplace-transactions', 'users'
    ];
    
    const newStats: {[key: string]: number} = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`/api/admin/${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          newStats[endpoint] = data.data.length;
        }
      } catch (err) {
        // 忽略错误
      }
    }
    
    setStats(newStats);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  const pveMenuItems: MenuItem[] = [
    {
      title: '节点管理',
      path: '/nodes',
      description: '管理区块链节点',
      icon: '🖥️',
      count: stats['nodes']
    },
    {
      title: '钱包管理',
      path: '/wallets',
      description: '管理用户钱包',
      icon: '💰',
      count: stats['wallets']
    },
    {
      title: '提现管理',
      path: '/withdrawals',
      description: '处理提现申请',
      icon: '💸',
      count: stats['withdrawals']
    },
    {
      title: '订单管理',
      path: '/orders',
      description: '查看和管理订单',
      icon: '📦',
      count: stats['orders']
    },
    {
      title: '交易记录',
      path: '/transactions',
      description: '查看所有交易记录',
      icon: '📊',
      count: stats['transactions']
    },
    {
      title: '登录日志',
      path: '/login-logs',
      description: '查看系统登录日志',
      icon: '📝'
    }
  ];

  const web3MenuItems: MenuItem[] = [
    {
      title: '分配记录',
      path: '/assigned-records',
      description: '节点分配记录',
      icon: '📋',
      count: stats['assigned-records']
    },
    {
      title: '佣金分配',
      path: '/commission-distribution',
      description: '佣金分配管理',
      icon: '💵'
    },
    {
      title: '佣金记录',
      path: '/commission-records',
      description: '查看佣金记录',
      icon: '💰',
      count: stats['commission-records']
    },
    {
      title: '层级关系',
      path: '/hierarchy',
      description: '用户层级管理',
      icon: '🌳',
      count: stats['hierarchy']
    },
    {
      title: '会员等级',
      path: '/member-level-config',
      description: '会员等级配置',
      icon: '⭐',
      count: stats['member-level-config']
    },
    {
      title: '节点列表',
      path: '/node-listings',
      description: '公开节点列表',
      icon: '📌'
    },
    {
      title: '操作日志',
      path: '/operation-logs',
      description: '系统操作日志',
      icon: '📜'
    },
    {
      title: '质押记录',
      path: '/staking-records',
      description: '质押记录管理',
      icon: '🔒'
    },
    {
      title: '提现记录',
      path: '/withdrawal-records',
      description: 'Web3 提现记录',
      icon: '💸'
    }
  ];

  const newFeatureItems: MenuItem[] = [
    {
      title: '云节点购买',
      path: '/cloud-node-purchases',
      description: '云节点购买记录',
      icon: '☁️',
      count: stats['cloud-node-purchases']
    },
    {
      title: '镜像节点购买',
      path: '/image-node-purchases',
      description: '镜像节点购买记录',
      icon: '💿',
      count: stats['image-node-purchases']
    },
    {
      title: '市场挂单',
      path: '/marketplace-listings',
      description: '节点市场挂单',
      icon: '🏪',
      count: stats['marketplace-listings']
    },
    {
      title: '市场交易',
      path: '/marketplace-transactions',
      description: '节点市场交易记录',
      icon: '🔄',
      count: stats['marketplace-transactions']
    },
    {
      title: '节点管理',
      path: '/nodes',
      description: '所有节点管理',
      icon: '🖥️',
      count: stats['nodes']
    },
    {
      title: '用户管理',
      path: '/users',
      description: '用户信息管理',
      icon: '👥',
      count: stats['users']
    },
    {
      title: '设备管理',
      path: '/devices',
      description: '用户设备管理',
      icon: '📱',
      count: stats['devices']
    },
    {
      title: '提现管理',
      path: '/withdrawals',
      description: '提现申请管理',
      icon: '💸',
      count: stats['withdrawals']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PVE 运营中心</h1>
              <p className="text-sm text-gray-500 mt-1">欢迎回来，{admin?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PVE 核心功能 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">PVE 核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pveMenuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{item.icon}</span>
                  {item.count !== undefined && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {item.count}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Web3 会员中心 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Web3 会员中心</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {web3MenuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{item.icon}</span>
                  {item.count !== undefined && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {item.count}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* 新增功能 */}
        <section>
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">新增功能</h2>
            <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
              NEW
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newFeatureItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left border-2 border-purple-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{item.icon}</span>
                  {item.count !== undefined && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {item.count}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
