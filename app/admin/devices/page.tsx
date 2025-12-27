'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Device {
  node_id: string;
  pve_node_id: string;
  vm_id: number;
  ip_address: string;
  device_name: string;
  online_status: string;
  total_income: number;
  daily_income: number;
  assigned_at: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/admin/devices');
      const data = await res.json();
      if (data.success) setDevices(data.data);
    } catch (error) {
      toast.error('获取设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>已分配设备管理</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>节点ID</TableHead>
                  <TableHead>PVE节点</TableHead>
                  <TableHead>VM ID</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead>设备名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>累计收益</TableHead>
                  <TableHead>每日收益</TableHead>
                  <TableHead>分配时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.node_id}>
                    <TableCell className="font-mono">{device.node_id}</TableCell>
                    <TableCell>{device.pve_node_id}</TableCell>
                    <TableCell>{device.vm_id}</TableCell>
                    <TableCell className="font-mono">{device.ip_address}</TableCell>
                    <TableCell>{device.device_name}</TableCell>
                    <TableCell>
                      <Badge variant={device.online_status === 'online' ? 'default' : 'secondary'}>
                        {device.online_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.total_income.toFixed(2)} ASHVA</TableCell>
                    <TableCell>{device.daily_income.toFixed(2)} ASHVA</TableCell>
                    <TableCell>{new Date(device.assigned_at).toLocaleString('zh-CN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
