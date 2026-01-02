'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TabType = 'customers' | 'machines' | 'nodes' | 'admins' | 'deployment';

export default function BlockchainManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [customers, setCustomers] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [deployedNodes, setDeployedNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  
  // 部署表单状态
  const [deployForm, setDeployForm] = useState({
    nodeType: 'Cosmos',
    nodeName: '',
    machineId: '',
    walletAddress: '',
  });

  useEffect(() => {
    // 加载各种数据
    Promise.all([
      fetch('/api/admin/blockchain/customers').then(r => r.json()),
      fetch('/api/admin/blockchain/machines').then(r => r.json()),
      fetch('/api/admin/blockchain/nodes').then(r => r.json()),
      fetch('/api/admin/blockchain/earnings').then(r => r.json()),
      fetch('/api/admin/blockchain/deployment').then(r => r.json()),
    ]).then(([customersData, machinesData, nodesData, earningsData, deploymentData]) => {
      if (customersData.success) setCustomers(customersData.data || []);
      if (machinesData.success) setMachines(machinesData.data || []);
      if (nodesData.success) setNodes(nodesData.data || []);
      if (earningsData.success) setEarnings(earningsData.data || []);
      if (deploymentData.success) setDeployedNodes(deploymentData.data || []);
      setLoading(false);
    }).catch(err => {
      console.error('加载失败:', err);
      setLoading(false);
    });
  }, []);

  const handleDeploy = async () => {
    if (!deployForm.nodeName || !deployForm.machineId || !deployForm.walletAddress) {
      alert('请填写完整信息');
      return;
    }

    setDeploying(true);
    try {
      const response = await fetch('/api/admin/blockchain/deployment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deploy',
          node_type: deployForm.nodeType,
          node_name: deployForm.nodeName,
          machine_id: deployForm.machineId,
          wallet_address: deployForm.walletAddress,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('节点部署成功！');
        // 重新加载节点列表
        const deploymentData = await fetch('/api/admin/blockchain/deployment').then(r => r.json());
        if (deploymentData.success) setDeployedNodes(deploymentData.data || []);
        // 清空表单
        setDeployForm({ nodeType: 'Cosmos', nodeName: '', machineId: '', walletAddress: '' });
      } else {
        alert('部署失败: ' + result.error);
      }
    } catch (error: any) {
      alert('部署出错: ' + error.message);
    } finally {
      setDeploying(false);
    }
  };

  const handleNodeAction = async (nodeId: string, action: 'start' | 'stop' | 'delete' | 'logs') => {
    try {
      if (action === 'delete' && !confirm('确定要删除这个节点吗？')) {
        return;
      }

      const response = await fetch('/api/admin/blockchain/deployment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          container_name: nodeId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        if (action === 'logs') {
          alert('节点日志:\n' + result.logs);
        } else {
          alert(`操作成功！`);
          // 重新加载节点列表
          const deploymentData = await fetch('/api/admin/blockchain/deployment').then(r => r.json());
          if (deploymentData.success) setDeployedNodes(deploymentData.data || []);
        }
      } else {
        alert('操作失败: ' + result.error);
      }
    } catch (error: any) {
      alert('操作出错: ' + error.message);
    }
  };

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
    { id: 'deployment', label: '节点部署与管理', count: deployedNodes.length },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">区块链管理中心</h1>
        <p className="text-gray-600 mt-2">统一管理区块链相关业务</p>
      </div>

      {/* 标签导航 */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
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

      {/* 节点部署与管理标签 - 新增 */}
      {activeTab === 'deployment' && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {deployedNodes.length}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">总节点数</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {deployedNodes.filter(n => n.status === 'running').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">🟢 运行中</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {deployedNodes.filter(n => n.status === 'stopped').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">🔴 已停止</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {deployedNodes.filter(n => n.status === 'deploying').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">🟡 部署中</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 部署区域 */}
          <Card>
            <CardHeader>
              <CardTitle>🚀 部署新节点</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">区块链类型</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={deployForm.nodeType}
                    onChange={(e) => setDeployForm({...deployForm, nodeType: e.target.value})}
                  >
                    <option>Cosmos</option>
                    <option>Ethereum</option>
                    <option>Bitcoin</option>
                    <option>Polkadot</option>
                    <option>Solana</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">节点名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded" 
                    placeholder="my-cosmos-node"
                    value={deployForm.nodeName}
                    onChange={(e) => setDeployForm({...deployForm, nodeName: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">分配机器</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={deployForm.machineId}
                    onChange={(e) => setDeployForm({...deployForm, machineId: e.target.value})}
                  >
                    <option value="">请选择...</option>
                    {machines.map(m => (
                      <option key={m.machine_id} value={m.machine_id}>
                        {m.machine_id} ({m.ip_address})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">钱包地址</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded" 
                    placeholder="0x..."
                    value={deployForm.walletAddress}
                    onChange={(e) => setDeployForm({...deployForm, walletAddress: e.target.value})}
                  />
                </div>
              </div>
              
              <button 
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                disabled={deploying}
                onClick={handleDeploy}
              >
                {deploying ? '⏳ 部署中...' : '🚀 部署节点'}
              </button>
            </CardContent>
          </Card>

          {/* 已部署节点列表 */}
          <Card>
            <CardHeader>
              <CardTitle>已部署节点列表</CardTitle>
            </CardHeader>
            <CardContent>
              {deployedNodes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无部署的节点</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">节点ID</th>
                        <th className="text-left p-4">类型</th>
                        <th className="text-center p-4">状态</th>
                        <th className="text-left p-4">所属机器</th>
                        <th className="text-right p-4">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deployedNodes.map((node: any) => (
                        <tr key={node.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-mono text-sm">{node.node_id}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {node.type}
                            </span>
                          </td>
                          <td className="text-center p-4">
                            <span className={`px-2 py-1 rounded text-sm ${
                              node.status === 'running' ? 'bg-green-100 text-green-800' :
                              node.status === 'stopped' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {node.status === 'running' ? '🟢 运行中' :
                               node.status === 'stopped' ? '🔴 已停止' : '🟡 部署中'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-sm">{node.machine_id}</td>
                          <td className="text-right p-4">
                            <div className="flex gap-2 justify-end">
                              <button 
                                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                                onClick={() => handleNodeAction(node.node_id, 'start')}
                              >
                                启动
                              </button>
                              <button 
                                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm"
                                onClick={() => handleNodeAction(node.node_id, 'stop')}
                              >
                                停止
                              </button>
                              <button 
                                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                                onClick={() => handleNodeAction(node.node_id, 'delete')}
                              >
                                删除
                              </button>
                              <button 
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                                onClick={() => handleNodeAction(node.node_id, 'logs')}
                              >
                                日志
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
