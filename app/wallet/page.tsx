'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WalletData {
  wallet_address: string;
  ashva_value: number;
  usdt_value: number;
  commission_balance: number;
  total_earnings: number;
  total_withdrawn: number;
  member_level: string;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 设置超时，避免一直加载
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('加载超时');
      }
    }, 5000);

    const address = localStorage.getItem('wallet_address') || 
                     localStorage.getItem('walletAddress') ||
                     sessionStorage.getItem('wallet_address');
    
    if (!address) {
      // 没有钱包地址，显示演示数据
      setLoading(false);
      clearTimeout(timeout);
      return;
    }

    // 获取钱包数据
    fetch(`/api/wallet?address=${address}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWallet(data.data);
        } else {
          setError(data.error || '获取钱包数据失败');
        }
        setLoading(false);
        clearTimeout(timeout);
      })
      .catch(err => {
        console.error('获取钱包数据失败:', err);
        setError('网络错误');
        setLoading(false);
        clearTimeout(timeout);
      });

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600">正在加载钱包数据...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 演示数据（当没有连接钱包时）
  const demoWallet: WalletData = {
    wallet_address: '0x0000...0000 (未连接)',
    ashva_value: 0,
    usdt_value: 0,
    commission_balance: 0,
    total_earnings: 0,
    total_withdrawn: 0,
    member_level: '未注册'
  };

  const displayWallet = wallet || demoWallet;
  const isDemo = !wallet;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">钱包管理</h1>
          {isDemo && (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span className="text-sm">演示模式 - 请连接钱包查看真实数据</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">❌</span>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className={isDemo ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                ASHVA余额
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {displayWallet.ashva_value.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                ≈ ${displayWallet.usdt_value.toFixed(2)} USDT
              </div>
            </CardContent>
          </Card>

          <Card className={isDemo ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                可提现佣金
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ${displayWallet.commission_balance.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-2">USDT</div>
              {!isDemo && (
                <button 
                  onClick={() => window.location.href = '/withdraw'}
                  className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  立即提现
                </button>
              )}
            </CardContent>
          </Card>

          <Card className={isDemo ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                总收益
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                ${displayWallet.total_earnings.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-2">累计收益</div>
            </CardContent>
          </Card>

          <Card className={isDemo ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💸</span>
                已提现
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                ${displayWallet.total_withdrawn.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-2">历史提现</div>
            </CardContent>
          </Card>

          <Card className={isDemo ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                会员等级
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {displayWallet.member_level}
              </div>
              <div className="text-sm text-gray-500 mt-2">当前等级</div>
            </CardContent>
          </Card>

          <Card className={isDemo ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔑</span>
                钱包地址
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono break-all bg-gray-100 p-3 rounded">
                {displayWallet.wallet_address}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = '/earnings'}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition"
              >
                <div className="text-2xl mb-2">💵</div>
                <div className="text-sm font-medium">收益详情</div>
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
                <div className="text-sm font-medium">团队管理</div>
              </button>

              <button 
                onClick={() => window.location.href = '/withdrawals'}
                className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition"
              >
                <div className="text-2xl mb-2">📜</div>
                <div className="text-sm font-medium">提现记录</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
