'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TabType = 'admins' | 'customers' | 'machines' | 'nodes';

export default function BlockchainManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [customers, setCustomers] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载各种数据 - 使用正确的API路径
    Promise.all([
      fetch('/api/admin/blockchain/customers').then(r => r.json()),
      fetch('/api/admin/blockchain/machines').then(r => r.json()),
      fetch('/api/admin/blockchain/nodes').then(r => r.json()),
      fetch('/api/admin/blockchain/earnings').then(r => r.json()),
    ]).then(([customersData, machinesData, nodesData, earningsData]) => {
      if (customersData.success) setCustomers(customersData.data || []);
      if (machinesData.success) setMachines(machinesData.data || []);
      if (nodesData.success) setNodes(nodesData.data || []);
      if (earningsData.success) setEarnings(earningsData.data || []);
      setLoading(false);
    }).catch(err => {
      console.error('加载失败:', err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-gray-600">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'customers', label: '区块链客户', count: customers.length },
    { id: 'machines', label: '区块链机器', count: machines.length },
    { id: 'nodes', label: '区块链节点', count: nodes.length },
    { id: 'admins', label: '收益管理', count: earnings.length },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">区块链管理中心</h1>
        <p className="text-gray-600 mt-2">统一管理区块链相关业务</p>
      </div>

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

      {/* 区块链客户标签 */}
      {activeTab === 'customers' && (
        <Card>
          <CardHeader><CardTitle>区块链客户列表</CardTitle></CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无客户数据</div>
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
              <div className="text-center py-8 text-gray-500">暂无机器数据</div>
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
              <div className="text-center py-8 text-gray-500">暂无节点数据</div>
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

      {/* 收益管理标签 */}
      {activeTab === 'admins' && (
        <Card>
          <CardHeader><CardTitle>区块链收益管理</CardTitle></CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无收益数据</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">ID</th>
                      <th className="text-left p-4">钱包地址</th>
                      <th className="text-right p-4">收益金额</th>
                      <th className="text-left p-4">来源</th>
                      <th className="text-right p-4">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((earning: any) => (
                      <tr key={earning.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{earning.id}</td>
                        <td className="p-4 font-mono text-sm">
                          {earning.wallet_address?.substring(0, 20)}...
                        </td>
                        <td className="text-right p-4 font-bold text-green-600">
                          ${(earning.amount || 0).toFixed(2)}
                        </td>
                        <td className="p-4">{earning.source || 'N/A'}</td>
                        <td className="text-right p-4">
                          {new Date(earning.created_at).toLocaleDateString('zh-CN')}
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
