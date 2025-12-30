'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WalletsPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 尝试从localStorage获取钱包地址
    const address = localStorage.getItem('walletAddress') || 
                     sessionStorage.getItem('walletAddress');
    
    if (!address) {
      setError('请先连接钱包');
      setLoading(false);
      return;
    }

    // 获取钱包信息
    fetch(`/api/v1/wallets/${address}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setWallet(data.data);
        } else {
          setError(data.error || '获取钱包信息失败');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('获取钱包信息失败:', err);
        setError('网络错误');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600">加载中...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="text-4xl">⚠️</div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">无法加载钱包信息</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  <button 
                    onClick={() => window.location.href = '/wallet'}
                    className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    前往钱包管理
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">我的钱包</h1>

        {/* 钱包信息卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">👛</span>
              钱包信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">钱包地址</label>
                <div className="font-mono text-sm bg-gray-100 p-3 rounded mt-1 break-all">
                  {wallet?.wallet_address || 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">ASHVA余额</label>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    {(wallet?.ashva_balance || 0).toFixed(2)} ASHVA
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">会员等级</label>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {wallet?.member_level || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">节点数量</label>
                  <div className="text-xl font-bold mt-1">
                    {wallet?.total_nodes || 0} 个
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">推荐人数</label>
                  <div className="text-xl font-bold mt-1">
                    {wallet?.referral_count || 0} 人
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">注册时间</label>
                <div className="text-sm mt-1">
                  {wallet?.created_at ? new Date(wallet.created_at).toLocaleString('zh-CN') : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = '/earnings'}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition"
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm font-medium">查看收益</div>
              </button>

              <button 
                onClick={() => window.location.href = '/nodes'}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition"
              >
                <div className="text-2xl mb-2">🖥️</div>
                <div className="text-sm font-medium">我的节点</div>
              </button>

              <button 
                onClick={() => window.location.href = '/team'}
                className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm font-medium">我的团队</div>
              </button>

              <button 
                onClick={() => window.location.href = '/withdrawals'}
                className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition"
              >
                <div className="text-2xl mb-2">💸</div>
                <div className="text-sm font-medium">提现记录</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
