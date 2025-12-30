'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const address = localStorage.getItem('wallet_address');
    if (address) {
      fetch(`/api/member?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setProfile(data.data);
        });
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">个人资料</h1>
      <Card>
        <CardHeader><CardTitle>账户信息</CardTitle></CardHeader>
        <CardContent>
          {profile ? (
            <div className="space-y-4">
              <div><span className="font-bold">钱包地址:</span> {profile.wallet_address}</div>
              <div><span className="font-bold">会员等级:</span> {profile.member_level}</div>
              <div><span className="font-bold">ASHVA余额:</span> {profile.ashva_value}</div>
              <div><span className="font-bold">团队人数:</span> {profile.team_count}</div>
            </div>
          ) : '加载中...'}
        </CardContent>
      </Card>
    </div>
  );
}
