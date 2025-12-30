
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeamPage() {
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const address = localStorage.getItem('wallet_address');
    if (address) {
      fetch(\`/api/team?address=\${address}\`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setTeam(data.data);
          setLoading(false);
        });
    }
  }, []);

  if (loading) return <div className="p-8">加载中...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">我的团队</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>团队总人数</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{team?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>直推人数</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{team?.direct || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>间推人数</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{team?.indirect || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
