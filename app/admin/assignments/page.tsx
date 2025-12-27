'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PendingOrder {
  id: number;
  node_id: string;
  wallet_address: string;
  product_type: string;
  amount_ashva: number;
  cpu_cores: number;
  memory_gb: number;
  storage_gb: number;
  status: string;
  created_at: string;
}

export default function AssignmentsPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [assignForm, setAssignForm] = useState({
    pveNodeId: '',
    vmId: '',
    ipAddress: '',
    deviceName: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders?status=pending');
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (error) {
      toast.error('获取订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedOrder) return;
    
    try {
      const res = await fetch('/api/admin/nodes/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: selectedOrder.node_id,
          pveNodeId: assignForm.pveNodeId,
          vmId: parseInt(assignForm.vmId),
          ipAddress: assignForm.ipAddress,
          deviceName: assignForm.deviceName
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('设备分配成功');
        fetchOrders();
        setSelectedOrder(null);
        setAssignForm({ pveNodeId: '', vmId: '', ipAddress: '', deviceName: '' });
      } else {
        toast.error(data.message || '分配失败');
      }
    } catch (error) {
      toast.error('分配请求失败');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>待分配订单</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单ID</TableHead>
                  <TableHead>钱包地址</TableHead>
                  <TableHead>产品类型</TableHead>
                  <TableHead>配置</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.node_id}</TableCell>
                    <TableCell className="font-mono text-xs">{order.wallet_address.slice(0, 10)}...</TableCell>
                    <TableCell>{order.product_type}</TableCell>
                    <TableCell>
                      {order.cpu_cores}C / {order.memory_gb}GB / {order.storage_gb}GB
                    </TableCell>
                    <TableCell>{order.amount_ashva.toLocaleString()} ASHVA</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleString('zh-CN')}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedOrder(order)}>
                            分配设备
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>分配设备 - {order.node_id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>PVE节点ID</Label>
                              <Input
                                value={assignForm.pveNodeId}
                                onChange={(e) => setAssignForm({ ...assignForm, pveNodeId: e.target.value })}
                                placeholder="例: pve-node-001"
                              />
                            </div>
                            <div>
                              <Label>VM ID</Label>
                              <Input
                                type="number"
                                value={assignForm.vmId}
                                onChange={(e) => setAssignForm({ ...assignForm, vmId: e.target.value })}
                                placeholder="例: 100"
                              />
                            </div>
                            <div>
                              <Label>IP地址</Label>
                              <Input
                                value={assignForm.ipAddress}
                                onChange={(e) => setAssignForm({ ...assignForm, ipAddress: e.target.value })}
                                placeholder="例: 192.168.1.100"
                              />
                            </div>
                            <div>
                              <Label>设备名称</Label>
                              <Input
                                value={assignForm.deviceName}
                                onChange={(e) => setAssignForm({ ...assignForm, deviceName: e.target.value })}
                                placeholder="例: 云节点-001"
                              />
                            </div>
                            <Button onClick={handleAssign} className="w-full">
                              确认分配
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
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
