
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users?page=1&limit=50')
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.data.users);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">用户管理</h1>
      <Card>
        <CardHeader><CardTitle>全部用户</CardTitle></CardHeader>
        <CardContent>
          {loading ? '加载中...' : (
            <table className="w-full">
              <thead><tr className="border-b">
                <th className="text-left p-4">钱包地址</th>
                <th className="text-right p-4">ASHVA余额</th>
                <th className="text-right p-4">会员等级</th>
                <th className="text-right p-4">注册时间</th>
              </tr></thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.wallet_address} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">{user.wallet_address}</td>
                    <td className="text-right p-4">{user.ashva_value?.toFixed(2)}</td>
                    <td className="text-right p-4">{user.member_level}</td>
                    <td className="text-right p-4">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
