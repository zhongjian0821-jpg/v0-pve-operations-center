'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TabType = 'cloud' | 'image' | 'listings';

export default function NodePurchasesManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('cloud');
  const [cloudPurchases, setCloudPurchases] = useState<any[]>([]);
  const [imagePurchases, setImagePurchases] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载各种购买数据
    Promise.all([
      fetch('/api/cloud-node-purchases').then(r => r.json()),
      fetch('/api/image-node-purchases').then(r => r.json()),
      fetch('/api/node-listings').then(r => r.json()),
    ]).then(([cloudData, imageData, listingsData]) => {
      if (cloudData.success) setCloudPurchases(cloudData.data || []);
      if (imageData.success) setImagePurchases(imageData.data || []);
      if (listingsData.success) setListings(listingsData.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  const tabs = [
    { id: 'cloud', label: '云节点购买', count: cloudPurchases.length },
    { id: 'image', label: '镜像节点购买', count: imagePurchases.length },
    { id: 'listings', label: '节点挂单', count: listings.length },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">节点购买管理</h1>

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
            {tab.count > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 云节点购买标签 */}
      {activeTab === 'cloud' && (
        <Card>
          <CardHeader>
            <CardTitle>云节点购买记录</CardTitle>
          </CardHeader>
          <CardContent>
            {cloudPurchases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无云节点购买记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">订单ID</th>
                      <th className="text-left p-4">用户钱包</th>
                      <th className="text-left p-4">节点类型</th>
                      <th className="text-right p-4">购买价格</th>
                      <th className="text-center p-4">状态</th>
                      <th className="text-right p-4">购买时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cloudPurchases.map((purchase: any) => (
                      <tr key={purchase.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono text-sm">{purchase.order_id}</td>
                        <td className="p-4 font-mono text-sm">
                          {purchase.wallet_address?.substring(0, 15)}...
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {purchase.node_type}
                          </span>
                        </td>
                        <td className="text-right p-4 font-bold">
                          ${(purchase.price || 0).toFixed(2)}
                        </td>
                        <td className="text-center p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            purchase.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : purchase.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {purchase.status === 'completed' ? '已完成' : 
                             purchase.status === 'pending' ? '处理中' : '已取消'}
                          </span>
                        </td>
                        <td className="text-right p-4">
                          {new Date(purchase.created_at).toLocaleDateString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 镜像节点购买标签 */}
      {activeTab === 'image' && (
        <Card>
          <CardHeader>
            <CardTitle>镜像节点购买记录</CardTitle>
          </CardHeader>
          <CardContent>
            {imagePurchases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无镜像节点购买记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">订单ID</th>
                      <th className="text-left p-4">用户钱包</th>
                      <th className="text-left p-4">镜像名称</th>
                      <th className="text-right p-4">镜像大小</th>
                      <th className="text-right p-4">购买价格</th>
                      <th className="text-center p-4">状态</th>
                      <th className="text-right p-4">购买时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imagePurchases.map((purchase: any) => (
                      <tr key={purchase.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono text-sm">{purchase.order_id}</td>
                        <td className="p-4 font-mono text-sm">
                          {purchase.wallet_address?.substring(0, 15)}...
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                            {purchase.image_name}
                          </span>
                        </td>
                        <td className="text-right p-4">{purchase.image_size || 'N/A'}</td>
                        <td className="text-right p-4 font-bold">
                          ${(purchase.price || 0).toFixed(2)}
                        </td>
                        <td className="text-center p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            purchase.status === 'deployed' 
                              ? 'bg-green-100 text-green-800' 
                              : purchase.status === 'downloading'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {purchase.status === 'deployed' ? '已部署' : 
                             purchase.status === 'downloading' ? '下载中' : '等待中'}
                          </span>
                        </td>
                        <td className="text-right p-4">
                          {new Date(purchase.created_at).toLocaleDateString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 节点挂单标签 */}
      {activeTab === 'listings' && (
        <Card>
          <CardHeader>
            <CardTitle>节点挂单列表</CardTitle>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无节点挂单</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">挂单ID</th>
                      <th className="text-left p-4">卖家钱包</th>
                      <th className="text-left p-4">节点ID</th>
                      <th className="text-left p-4">节点类型</th>
                      <th className="text-right p-4">挂单价格</th>
                      <th className="text-center p-4">状态</th>
                      <th className="text-right p-4">挂单时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing: any) => (
                      <tr key={listing.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono text-sm">{listing.listing_id}</td>
                        <td className="p-4 font-mono text-sm">
                          {listing.seller_address?.substring(0, 15)}...
                        </td>
                        <td className="p-4 font-mono text-sm">{listing.node_id}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            {listing.node_type}
                          </span>
                        </td>
                        <td className="text-right p-4 font-bold text-lg">
                          ${(listing.price || 0).toFixed(2)}
                        </td>
                        <td className="text-center p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            listing.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : listing.status === 'sold'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {listing.status === 'active' ? '在售' : 
                             listing.status === 'sold' ? '已售出' : '已取消'}
                          </span>
                        </td>
                        <td className="text-right p-4">
                          {new Date(listing.created_at).toLocaleDateString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
