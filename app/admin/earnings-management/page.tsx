'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EarningsManagementPage() {
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error('请输入数据');
      return;
    }

    setLoading(true);
    try {
      const lines = csvData.trim().split('\n');
      const earnings = lines.map(line => {
        const [node_id, total_income, daily_income] = line.split(',');
        return {
          node_id: node_id.trim(),
          total_income: parseFloat(total_income),
          daily_income: parseFloat(daily_income)
        };
      });

      const res = await fetch('/api/admin/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ earnings })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`成功更新 ${data.data.updated_count} 条记录`);
        setCsvData('');
      } else {
        toast.error(data.message || '导入失败');
      }
    } catch (error) {
      toast.error('导入请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>批量导入节点收益</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>数据格式：node_id,total_income,daily_income</Label>
            <Textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="CN-001,150.50,5.25\nCN-002,200.00,6.50\nCN-003,180.75,5.80"
              rows={15}
              className="font-mono text-sm"
            />
          </div>
          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? '导入中...' : '开始导入'}
          </Button>
          <div className="text-sm text-gray-500">
            <p>示例格式：</p>
            <pre className="mt-2 bg-gray-50 p-2 rounded">
CN-TEST-001,150.50,5.25
CN-TEST-002,200.00,6.50
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
