'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TabType = 'market' | 'myListings' | 'transactions';

interface Listing {
  id: number;
  node_id: string;
  node_type: string;
  price: number;
  seller_address: string;
  status: string;
  created_at: string;
}

export default function MarketplaceEnhancedPage() {
  const [activeTab, setActiveTab] = useState<TabType>('market');
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const address = localStorage.getItem('wallet_address');
    
    // 加载市场挂单
    fetch('/api/transfer/marketplace')
      .then(res => res.json())
      .then(data => {
        if (data.success) setListings(data.data || []);
        setLoading(false);
      });

    if (address) {
      // 加载我的挂单
      fetch(`/api/transfer/my-listings?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setMyListings(data.data || []);
        });

      // 加载交易记录
      fetch(`/api/transfer/transactions?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setTransactions(data.data || []);
        });
    }
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  const tabs = [
    { id: 'market', label: '市场' },
    { id: 'myListings', label: '我的挂单' },
    { id: 'transactions', label: '交易记录' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">转让市场</h1>

      {/* 标签导航 */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 市场标签 */}
      {activeTab === 'market' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">可购买节点</h2>
            <p className="text-gray-600">从其他用户购买节点，无需等待部署</p>
          </div>

          {listings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">暂无在售节点</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => (
                <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500">节点类型</div>
                        <div className="text-lg font-bold">{listing.node_type}</div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">节点ID</div>
                        <div className="text-sm font-mono">{listing.node_id}</div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">售价</div>
                        <div className="text-2xl font-bold text-blue-600">
                          ${listing.price.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">卖家</div>
                        <div className="text-sm font-mono">
                          {listing.seller_address.substring(0, 10)}...
                        </div>
                      </div>

                      <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        立即购买
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 我的挂单标签 */}
      {activeTab === 'myListings' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold mb-2">我的挂单</h2>
              <p className="text-gray-600">管理你的节点出售挂单</p>
            </div>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
              + 新建挂单
            </button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {myListings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无挂单</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">节点ID</th>
                        <th className="text-left p-4">类型</th>
                        <th className="text-right p-4">挂单价格</th>
                        <th className="text-center p-4">状态</th>
                        <th className="text-right p-4">创建时间</th>
                        <th className="text-center p-4">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myListings.map(listing => (
                        <tr key={listing.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-mono text-sm">{listing.node_id}</td>
                          <td className="p-4">{listing.node_type}</td>
                          <td className="text-right p-4 font-bold">
                            ${listing.price.toFixed(2)}
                          </td>
                          <td className="text-center p-4">
                            <span className={`px-2 py-1 rounded text-sm ${
                              listing.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {listing.status === 'active' ? '在售' : '已售出'}
                            </span>
                          </td>
                          <td className="text-right p-4">
                            {new Date(listing.created_at).toLocaleDateString('zh-CN')}
                          </td>
                          <td className="text-center p-4">
                            {listing.status === 'active' && (
                              <button className="text-red-500 hover:text-red-700 text-sm">
                                取消挂单
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 交易记录标签 */}
      {activeTab === 'transactions' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">交易记录</h2>
            <p className="text-gray-600">查看你的买卖交易历史</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无交易记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">交易类型</th>
                        <th className="text-left p-4">节点ID</th>
                        <th className="text-left p-4">节点类型</th>
                        <th className="text-right p-4">交易金额</th>
                        <th className="text-center p-4">状态</th>
                        <th className="text-right p-4">交易时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx: any) => (
                        <tr key={tx.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-sm ${
                              tx.type === 'buy' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {tx.type === 'buy' ? '购买' : '出售'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-sm">{tx.node_id}</td>
                          <td className="p-4">{tx.node_type}</td>
                          <td className="text-right p-4 font-bold">
                            ${tx.amount.toFixed(2)}
                          </td>
                          <td className="text-center p-4">
                            <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                              {tx.status}
                            </span>
                          </td>
                          <td className="text-right p-4">
                            {new Date(tx.created_at).toLocaleDateString('zh-CN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
