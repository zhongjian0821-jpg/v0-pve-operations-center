'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TabType = 'admins' | 'customers' | 'machines' | 'nodes';

export default function BlockchainManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('admins');
  const [admins, setAdmins] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载各种数据
    Promise.all([
      fetch('/api/bl-admins').then(r => r.json()),
      fetch('/api/bl-customers').then(r => r.json()),
      fetch('/api/bl-machines').then(r => r.json()),
      fetch('/api/bl-nodes').then(r => r.json()),
    ]).then(([adminsData, customersData, machinesData, nodesData]) => {
      if (adminsData.success) setAdmins(adminsData.data || []);
      if (customersData.success) setCustomers(customersData.data || []);
      if (machinesData.success) setMachines(machinesData.data || []);
      if (nodesData.success) setNodes(nodesData.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  const tabs = [
    { id: 'admins', label: '区块链管理员', count: admins.length },
    { id: 'customers', label: '区块链客户', count: customers.length },
    { id: 'machines', label: '区块链机器', count: machines.length },
    { id: 'nodes', label: '区块链节点', count: nodes.length },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">区块链管理中心</h1>

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

      {/* 区块链管理员标签 */}
      {activeTab === 'admins' && (
        <Card>
          <CardHeader><CardTitle>区块链管理员列表</CardTitle></CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无管理员</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">ID</th>
                      <th className="text-left p-4">钱包地址</th>
                      <th className="text-center p-4">权限级别</th>
                      <th className="text-center p-4">状态</th>
                      <th className="text-right p-4">创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin: any) => (
                      <tr key={admin.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{admin.id}</td>
                        <td className="p-4 font-mono text-sm">
                          {admin.wallet_address?.substring(0, 20)}...
                        </td>
                        <td className="text-center p-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                            {admin.role || 'Admin'}
                          </span>
                        </td>
                        <td className="text-center p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            admin.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {admin.active ? '活跃' : '禁用'}
                          </span>
                        </td>
                        <td className="text-right p-4">
                          {new Date(admin.created_at).toLocaleDateString('zh-CN')}
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

      {/* 区块链客户标签 */}
      {activeTab === 'customers' && (
        <Card>
          <CardHeader><CardTitle>区块链客户列表</CardTitle></CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无客户</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">ID</th>
                      <th className="text-left p-4">钱包地址</th>
                      <th className="text-right p-4">节点数量</th>
                      <th className="text-right p-4">总投资</th>
                      <th className="text-right p-4">注册时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer: any) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{customer.id}</td>
                        <td className="p-4 font-mono text-sm">
                          {customer.wallet_address?.substring(0, 20)}...
                        </td>
                        <td className="text-right p-4 font-bold">
                          {customer.node_count || 0}
                        </td>
                        <td className="text-right p-4 font-bold">
                          ${(customer.total_investment || 0).toFixed(2)}
                        </td>
                        <td className="text-right p-4">
                          {new Date(customer.created_at).toLocaleDateString('zh-CN')}
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

      {/* 区块链机器标签 */}
      {activeTab === 'machines' && (
        <Card>
          <CardHeader><CardTitle>区块链机器列表</CardTitle></CardHeader>
          <CardContent>
            {machines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无机器</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">机器ID</th>
                      <th className="text-left p-4">IP地址</th>
                      <th className="text-center p-4">CPU</th>
                      <th className="text-center p-4">内存</th>
                      <th className="text-center p-4">状态</th>
                      <th className="text-right p-4">运行节点数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map((machine: any) => (
                      <tr key={machine.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono text-sm">{machine.machine_id}</td>
                        <td className="p-4 font-mono text-sm">{machine.ip_address}</td>
                        <td className="text-center p-4">{machine.cpu_cores || 'N/A'}</td>
                        <td className="text-center p-4">{machine.memory_gb || 'N/A'}GB</td>
                        <td className="text-center p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            machine.status === 'online' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {machine.status === 'online' ? '在线' : '离线'}
                          </span>
                        </td>
                        <td className="text-right p-4 font-bold">
                          {machine.node_count || 0}
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

      {/* 区块链节点标签 */}
      {activeTab === 'nodes' && (
        <Card>
          <CardHeader><CardTitle>区块链节点列表</CardTitle></CardHeader>
          <CardContent>
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无节点</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">节点ID</th>
                      <th className="text-left p-4">类型</th>
                      <th className="text-left p-4">所属机器</th>
                      <th className="text-center p-4">状态</th>
                      <th className="text-right p-4">日收益</th>
                      <th className="text-right p-4">运行时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map((node: any) => (
                      <tr key={node.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono text-sm">{node.node_id}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {node.node_type}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-sm">{node.machine_id}</td>
                        <td className="text-center p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            node.status === 'running' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {node.status === 'running' ? '运行中' : '维护中'}
                          </span>
                        </td>
                        <td className="text-right p-4 font-bold">
                          ${(node.daily_earnings || 0).toFixed(2)}
                        </td>
                        <td className="text-right p-4">
                          {node.uptime_days || 0} 天
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
