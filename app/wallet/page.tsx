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

  useEffect(() => {
    const address = localStorage.getItem('wallet_address');
    if (address) {
      fetch(`/api/wallet?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setWallet(data.data);
          }
          setLoading(false);
        });
    }
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  if (!wallet) {
    return <div className="p-8">请先连接钱包</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">钱包管理</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ASHVA余额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{wallet.ashva_value.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">
              ≈ ${wallet.usdt_value.toFixed(2)} USDT
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>可提现佣金</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${wallet.commission_balance.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">USDT</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>总收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${wallet.total_earnings.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">累计收益</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已提现</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${wallet.total_withdrawn.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">历史提现</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>会员等级</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{wallet.member_level}</div>
            <div className="text-sm text-gray-500 mt-2">当前等级</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>钱包地址</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono break-all">{wallet.wallet_address}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
