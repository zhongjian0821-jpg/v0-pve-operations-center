'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TabType = 'customers' | 'machines' | 'nodes' | 'admins' | 'deployment';

interface TaskStats {
  overview: {
    total_tasks: number;
    running_tasks: number;
    stopped_tasks: number;
    deploying_tasks: number;
  };
  earnings: {
    today: number;
    this_hour: number;
    total: number;
    avg_daily: number;
    avg_hourly: number;
  };
  machine_distribution: Array<{
    machine_id: number;
    machine_name: string;
    ip_address: string;
    specs: {
      cpu: number;
      memory: number;
      storage: number;
    };
    task_count: number;
    daily_earnings: number;
  }>;
  node_type_distribution: Array<{
    type: string;
    count: number;
    daily_earnings: number;
  }>;
}

export default function BlockchainManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('deployment');
  const [customers, setCustomers] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  
  // 部署表单状态
  const [deployForm, setDeployForm] = useState({
    nodeType: 'Cosmos Hub',
    taskName: '',
    machineId: '',
    nodeId: '',
    walletAddress: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersData, machinesData, nodesData, earningsData, tasksData, statsData] = await Promise.all([
        fetch('/api/admin/blockchain/customers').then(r => r.json()),
        fetch('/api/admin/blockchain/machines').then(r => r.json()),
        fetch('/api/admin/blockchain/nodes').then(r => r.json()),
        fetch('/api/admin/blockchain/earnings').then(r => r.json()),
        fetch('/api/admin/blockchain/tasks').then(r => r.json()),
        fetch('/api/admin/blockchain/task-stats').then(r => r.json()),
      ]);

      if (customersData.success) setCustomers(customersData.data || []);
      if (machinesData.success) setMachines(machinesData.data || []);
      if (nodesData.success) setNodes(nodesData.data || []);
      if (earningsData.success) setEarnings(earningsData.data || []);
      if (tasksData.success) setTasks(tasksData.data || []);
      if (statsData.success) setStats(statsData.data);
      
      setLoading(false);
    } catch (err) {
      console.error('加载失败:', err);
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!deployForm.taskName || !deployForm.machineId || !deployForm.nodeId) {
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
          task_name: deployForm.taskName,
          node_id: deployForm.nodeId,
          machine_id: deployForm.machineId,
          wallet_address: deployForm.walletAddress,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('任务部署成功！');
        loadData(); // 重新加载所有数据
        setDeployForm({ 
          nodeType: 'Cosmos Hub', 
          taskName: '', 
          machineId: '', 
          nodeId: '',
          walletAddress: '' 
        });
      } else {
        alert('部署失败: ' + result.error);
      }
    } catch (error: any) {
      alert('部署出错: ' + error.message);
    } finally {
      setDeploying(false);
    }
  };

  const handleTaskAction = async (taskId: number, action: 'start' | 'stop' | 'delete' | 'logs') => {
    try {
      if (action === 'delete' && !confirm('确定要删除这个任务吗？')) {
        return;
      }

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const response = await fetch('/api/admin/blockchain/deployment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          container_name: task.container_name,
        }),
      });

      const result = await response.json();
      if (result.success) {
        if (action === 'logs') {
          alert('任务日志:\n' + result.logs);
        } else {
          alert(`操作成功！`);
          loadData();
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
    { id: 'deployment', label: '节点部署与管理', count: tasks.length },
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
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="mt-6">
        {activeTab === 'deployment' && (
          <div className="space-y-6">
            {/* 统计卡片 */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {stats.overview.total_tasks}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">总任务数</div>
                      <div className="text-xs text-gray-500 mt-2">
                        运行中: {stats.overview.running_tasks}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {stats.overview.running_tasks}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">运行中</div>
                      <div className="text-xs text-gray-500 mt-2">
                        已停止: {stats.overview.stopped_tasks}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        ${stats.earnings.today.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">今日收益</div>
                      <div className="text-xs text-gray-500 mt-2">
                        平均: ${stats.earnings.avg_daily.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        ${stats.earnings.this_hour.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">本小时收益</div>
                      <div className="text-xs text-gray-500 mt-2">
                        平均: ${stats.earnings.avg_hourly.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 机器任务分布 */}
            {stats && stats.machine_distribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>机器任务分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.machine_distribution.map(machine => (
                      <div 
                        key={machine.machine_id} 
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {machine.machine_name || `机器-${machine.machine_id}`}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {machine.ip_address || '未配置IP'} | 
                            {machine.specs.cpu}核 / {machine.specs.memory}GB / {machine.specs.storage}GB
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-blue-600">
                            {machine.task_count}
                          </div>
                          <div className="text-xs text-gray-500">个任务</div>
                          <div className="text-sm text-green-600 mt-1">
                            ${machine.daily_earnings.toFixed(2)}/天
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 部署新任务 */}
            <Card>
              <CardHeader>
                <CardTitle>🚀 部署新任务</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      节点类型
                    </label>
                    <select
                      value={deployForm.nodeType}
                      onChange={(e) => setDeployForm({...deployForm, nodeType: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Cosmos Hub">Cosmos Hub 验证节点</option>
                      <option value="Polygon">Polygon 验证节点</option>
                      <option value="NEAR">NEAR 验证节点</option>
                      <option value="Sui">Sui 验证节点</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      任务名称
                    </label>
                    <input
                      type="text"
                      value={deployForm.taskName}
                      onChange={(e) => setDeployForm({...deployForm, taskName: e.target.value})}
                      placeholder="例如: validator-1"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择节点 (Node ID)
                    </label>
                    <input
                      type="text"
                      value={deployForm.nodeId}
                      onChange={(e) => setDeployForm({...deployForm, nodeId: e.target.value})}
                      placeholder="输入node_id"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      机器ID
                    </label>
                    <input
                      type="text"
                      value={deployForm.machineId}
                      onChange={(e) => setDeployForm({...deployForm, machineId: e.target.value})}
                      placeholder="输入machine_id"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      钱包地址
                    </label>
                    <input
                      type="text"
                      value={deployForm.walletAddress}
                      onChange={(e) => setDeployForm({...deployForm, walletAddress: e.target.value})}
                      placeholder="0x..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      onClick={handleDeploy}
                      disabled={deploying}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {deploying ? '部署中...' : '🚀 部署任务'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 任务列表 */}
            <Card>
              <CardHeader>
                <CardTitle>💰 任务明细 ({tasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium text-gray-700">任务名称</th>
                        <th className="text-left p-3 font-medium text-gray-700">节点类型</th>
                        <th className="text-left p-3 font-medium text-gray-700">机器</th>
                        <th className="text-center p-3 font-medium text-gray-700">状态</th>
                        <th className="text-right p-3 font-medium text-gray-700">小时收益</th>
                        <th className="text-right p-3 font-medium text-gray-700">日收益</th>
                        <th className="text-right p-3 font-medium text-gray-700">总收益</th>
                        <th className="text-center p-3 font-medium text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-500">
                            暂无任务数据
                          </td>
                        </tr>
                      ) : (
                        tasks.map((task: any) => (
                          <tr key={task.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="font-medium">{task.task_name || task.container_name}</div>
                              <div className="text-xs text-gray-500">{task.container_id?.substring(0, 12)}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                {task.node_type}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">{task.machine_name || `机器-${task.machine_id}`}</div>
                              <div className="text-xs text-gray-500">{task.ip_address}</div>
                            </td>
                            <td className="text-center p-3">
                              <span className={`px-2 py-1 rounded text-sm ${
                                task.status === 'running' 
                                  ? 'bg-green-100 text-green-800' 
                                  : task.status === 'stopped'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {task.status === 'running' ? '运行中' : task.status === 'stopped' ? '已停止' : '部署中'}
                              </span>
                            </td>
                            <td className="text-right p-3 font-medium">
                              ${(task.hourly_earnings || 0).toFixed(4)}
                            </td>
                            <td className="text-right p-3 font-medium text-green-600">
                              ${(task.daily_earnings || 0).toFixed(2)}
                            </td>
                            <td className="text-right p-3 font-bold">
                              ${(task.total_earnings || 0).toFixed(2)}
                            </td>
                            <td className="text-center p-3">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => handleTaskAction(task.id, 'stop')}
                                  className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                >
                                  停止
                                </button>
                                <button
                                  onClick={() => handleTaskAction(task.id, 'delete')}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                                >
                                  删除
                                </button>
                                <button
                                  onClick={() => handleTaskAction(task.id, 'logs')}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                                >
                                  日志
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 其他标签页内容保持不变 */}
        {activeTab === 'customers' && (
          <Card>
            <CardHeader>
              <CardTitle>区块链客户 ({customers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无客户数据</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">ID</th>
                        <th className="text-left p-3">名称</th>
                        <th className="text-left p-3">钱包地址</th>
                        <th className="text-center p-3">状态</th>
                        <th className="text-right p-3">机器数</th>
                        <th className="text-right p-3">总收益</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer: any) => (
                        <tr key={customer.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{customer.id}</td>
                          <td className="p-3">{customer.name}</td>
                          <td className="p-3 font-mono text-sm">{customer.wallet_address}</td>
                          <td className="text-center p-3">
                            <span className={`px-2 py-1 rounded text-sm ${
                              customer.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {customer.status}
                            </span>
                          </td>
                          <td className="text-right p-3">{customer.total_machines || 0}</td>
                          <td className="text-right p-3 font-medium">
                            ${(customer.total_earnings || 0).toFixed(2)}
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

        {activeTab === 'machines' && (
          <Card>
            <CardHeader>
              <CardTitle>区块链机器 ({machines.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {machines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无机器数据</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">ID</th>
                        <th className="text-left p-3">机器名称</th>
                        <th className="text-left p-3">IP地址</th>
                        <th className="text-left p-3">所属客户</th>
                        <th className="text-center p-3">状态</th>
                        <th className="text-left p-3">激活码</th>
                      </tr>
                    </thead>
                    <tbody>
                      {machines.map((machine: any) => (
                        <tr key={machine.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{machine.id}</td>
                          <td className="p-3">{machine.machine_name || '未命名'}</td>
                          <td className="p-3 font-mono text-sm">{machine.ip_address || '未配置'}</td>
                          <td className="p-3">{machine.customer_name || '未分配'}</td>
                          <td className="text-center p-3">
                            <span className={`px-2 py-1 rounded text-sm ${
                              machine.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : machine.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {machine.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs">{machine.activation_code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'nodes' && (
          <Card>
            <CardHeader>
              <CardTitle>区块链节点 ({nodes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {nodes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无节点数据</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">节点ID</th>
                        <th className="text-left p-3">钱包地址</th>
                        <th className="text-left p-3">类型</th>
                        <th className="text-center p-3">状态</th>
                        <th className="text-right p-3">总收益</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map((node: any) => (
                        <tr key={node.node_id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono text-sm">{node.node_id}</td>
                          <td className="p-3 font-mono text-sm">{node.wallet_address}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {node.node_type}
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <span className={`px-2 py-1 rounded text-sm ${
                              node.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : node.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {node.status}
                            </span>
                          </td>
                          <td className="text-right p-3 font-medium">
                            ${(node.total_earnings || 0).toFixed(2)}
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

        {activeTab === 'admins' && (
          <Card>
            <CardHeader>
              <CardTitle>收益管理 ({earnings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {earnings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无收益数据</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">ID</th>
                        <th className="text-left p-3">机器ID</th>
                        <th className="text-left p-3">节点ID</th>
                        <th className="text-right p-3">金额</th>
                        <th className="text-left p-3">币种</th>
                        <th className="text-left p-3">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.map((earning: any) => (
                        <tr key={earning.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{earning.id}</td>
                          <td className="p-3">{earning.machine_id}</td>
                          <td className="p-3">{earning.node_id}</td>
                          <td className="text-right p-3 font-medium text-green-600">
                            {earning.amount}
                          </td>
                          <td className="p-3">{earning.currency}</td>
                          <td className="p-3 text-sm text-gray-600">
                            {new Date(earning.created_at).toLocaleString('zh-CN')}
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
    </div>
  );
}
