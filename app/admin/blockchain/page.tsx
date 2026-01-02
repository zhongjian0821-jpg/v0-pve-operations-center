'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 节点类型定义
const NODE_TYPES = [
  { value: 'cosmos', label: 'Cosmos Hub', hourlyEarning: 0.22, dailyEarning: 5.20 },
  { value: 'polygon', label: 'Polygon', hourlyEarning: 0.35, dailyEarning: 8.50 },
  { value: 'near', label: 'NEAR', hourlyEarning: 0.26, dailyEarning: 6.30 },
  { value: 'sui', label: 'Sui', hourlyEarning: 0.53, dailyEarning: 12.80 },
];

export default function BlockchainManagementPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  
  const [deployForm, setDeployForm] = useState({
    nodeType: 'cosmos',
    nodeName: '',
    nodeId: '',
    walletAddress: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [machinesRes, nodesRes] = await Promise.all([
        fetch('/api/admin/blockchain/machines'),
        fetch('/api/admin/blockchain/nodes'),
      ]);

      const machinesData = await machinesRes.json();
      const nodesData = await nodesRes.json();

      if (machinesData.success) setMachines(machinesData.data || []);
      if (nodesData.success) setNodes(nodesData.data || []);
      setLoading(false);
    } catch (err) {
      console.error('加载失败:', err);
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!selectedMachine || !deployForm.nodeName) {
      alert('请选择机器并填写任务名称');
      return;
    }

    const machine = machines.find(m => m.id === selectedMachine);
    if (!machine) return;

    setDeploying(true);
    try {
      const response = await fetch('/api/admin/blockchain/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName: deployForm.nodeName,
          nodeType: deployForm.nodeType,
          nodeId: deployForm.nodeId,
          machineId: selectedMachine,
          walletAddress: deployForm.walletAddress,
          serverIp: machine.ip_address,
          sshPort: machine.ssh_port,
          sshUser: machine.ssh_user,
          sshPassword: machine.ssh_password,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ 部署成功！');
        await loadData();
        setDeployForm({ nodeType: 'cosmos', nodeName: '', nodeId: '', walletAddress: '' });
        setSelectedMachine(null);
      } else {
        alert('❌ 部署失败: ' + result.error);
      }
    } catch (error: any) {
      alert('❌ 部署失败: ' + error.message);
    } finally {
      setDeploying(false);
    }
  };

  // 计算统计数据
  const pendingMachines = machines.filter(m => 
    m.status === 'active' && nodes.filter(n => n.machine_id === m.id).length === 0
  );

  const taskStats = NODE_TYPES.map(type => {
    const typeTasks = nodes.filter(n => n.node_type === type.value);
    const runningCount = typeTasks.filter(n => n.status === 'running').length;
    return {
      ...type,
      totalCount: typeTasks.length,
      runningCount,
      hourlyTotal: (runningCount * type.hourlyEarning).toFixed(2),
      dailyTotal: (runningCount * type.dailyEarning).toFixed(2),
    };
  });

  const stats = {
    totalMachines: machines.length,
    availableMachines: machines.filter(m => m.status === 'active').length,
    pendingMachines: pendingMachines.length,
    totalNodes: nodes.length,
    runningNodes: nodes.filter(n => n.status === 'running').length,
    totalHourly: taskStats.reduce((sum, s) => sum + parseFloat(s.hourlyTotal), 0).toFixed(2),
    totalDaily: taskStats.reduce((sum, s) => sum + parseFloat(s.dailyTotal), 0).toFixed(2),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* 标题 */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">区块链任务管理中心</h1>
          <p className="text-gray-400">管理机器 · 部署任务 · 监控收益</p>
        </div>

        {/* 顶部统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.totalMachines}</div>
                  <div className="text-sm text-gray-400">总机器数</div>
                  <div className="text-xs text-green-400">{stats.availableMachines} 可用</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.totalNodes}</div>
                  <div className="text-sm text-gray-400">总任务数</div>
                  <div className="text-xs text-green-400">{stats.runningNodes} 运行中</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <div className="text-2xl font-bold text-white">${stats.totalHourly}</div>
                  <div className="text-sm text-gray-400">每小时收益</div>
                  <div className="text-xs text-yellow-400">实时</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 col-span-1 md:col-span-3">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-white">${stats.totalDaily} / 日 · ${(parseFloat(stats.totalDaily) * 30).toFixed(2)} / 月</div>
                  <div className="text-sm text-gray-400">每日收益预计 · 月度收益预计</div>
                  <div className="text-xs text-purple-400">基于当前运行任务</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 三列布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左侧：机器列表 */}
          <div className="lg:col-span-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">机器列表 ({machines.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {pendingMachines.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-bold text-orange-400 mb-2">⚠️ 待部署机器 ({pendingMachines.length})</div>
                      {pendingMachines.map(machine => (
                        <div
                          key={machine.id}
                          onClick={() => setSelectedMachine(machine.id)}
                          className={`p-3 mb-2 rounded-lg cursor-pointer transition-all border-2 ${
                            selectedMachine === machine.id
                              ? 'bg-orange-500/30 border-orange-500'
                              : 'bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-white">{machine.machine_name}</div>
                              <div className="text-sm text-gray-400">{machine.ip_address}</div>
                            </div>
                            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">待部署</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
                            <div>💻 {machine.cpu_cores} 核</div>
                            <div>💾 {machine.memory_gb} GB</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {machines.filter(m => nodes.some(n => n.machine_id === m.id)).map(machine => (
                    <div
                      key={machine.id}
                      onClick={() => setSelectedMachine(machine.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedMachine === machine.id
                          ? 'bg-blue-500/30 border-2 border-blue-500'
                          : 'bg-gray-700/30 border border-gray-600 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-white">{machine.machine_name}</div>
                          <div className="text-sm text-gray-400">{machine.ip_address}</div>
                        </div>
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">运行中</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
                        <div>💻 {machine.cpu_cores} 核</div>
                        <div>💾 {machine.memory_gb} GB</div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
                        运行任务: <span className="text-green-400">{nodes.filter(n => n.machine_id === machine.id).length}</span> 个
                      </div>
                    </div>
                  ))}

                  {machines.length === 0 && (
                    <div className="text-center text-gray-500 py-8">暂无机器</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 中间：任务统计 */}
          <div className="lg:col-span-5">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">任务类型统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taskStats.map(stat => (
                    <div key={stat.value} className="p-4 bg-gray-700/30 border border-gray-600 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="font-bold text-white text-lg">{stat.label}</div>
                          <div className="text-sm text-gray-400">
                            {stat.totalCount} 台机器 · {stat.runningCount} 运行中
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">${stat.hourlyTotal}/时</div>
                          <div className="text-sm text-gray-400">${stat.dailyTotal}/天</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {stat.runningCount > 0 && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                            ✓ 运行 {stat.runningCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-bold text-white mt-6 mb-3">所有运行任务</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {nodes.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">暂无任务</div>
                  ) : (
                    nodes.map(node => (
                      <div key={node.id} className="p-3 bg-gray-700/30 border border-gray-600 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-white">{node.task_name}</div>
                            <div className="text-xs text-gray-400">
                              {NODE_TYPES.find(nt => nt.value === node.node_type)?.label}
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-white text-xs rounded ${
                            node.status === 'running' ? 'bg-green-500' :
                            node.status === 'stopped' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            {node.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：部署表单 */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800/50 border-gray-700 sticky top-6">
              <CardHeader>
                <CardTitle className="text-white">部署新任务</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm mb-2 block">选择机器</label>
                    <select 
                      className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                      value={selectedMachine || ''}
                      onChange={(e) => setSelectedMachine(Number(e.target.value))}
                    >
                      <option value="">请选择机器</option>
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.machine_name} ({m.ip_address})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-white text-sm mb-2 block">任务类型</label>
                    <select 
                      className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                      value={deployForm.nodeType}
                      onChange={(e) => setDeployForm({...deployForm, nodeType: e.target.value})}
                    >
                      {NODE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label} (${type.hourlyEarning}/时)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-white text-sm mb-2 block">任务名称</label>
                    <input
                      type="text"
                      placeholder="例如: validator-1"
                      className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                      value={deployForm.nodeName}
                      onChange={(e) => setDeployForm({...deployForm, nodeName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm mb-2 block">Node ID</label>
                    <input
                      type="text"
                      placeholder="例如: node-001"
                      className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                      value={deployForm.nodeId}
                      onChange={(e) => setDeployForm({...deployForm, nodeId: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm mb-2 block">钱包地址</label>
                    <input
                      type="text"
                      placeholder="例如: cosmos1abc..."
                      className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                      value={deployForm.walletAddress}
                      onChange={(e) => setDeployForm({...deployForm, walletAddress: e.target.value})}
                    />
                  </div>

                  <button 
                    onClick={handleDeploy}
                    disabled={!selectedMachine || !deployForm.nodeName || deploying}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deploying ? '部署中...' : '立即部署任务'}
                  </button>

                  {deployForm.nodeType && (
                    <div className="p-3 bg-green-500/20 border border-green-500/30 rounded">
                      <div className="text-sm text-white">
                        <div className="font-bold mb-1">预计收益</div>
                        <div className="text-xs text-green-300">
                          每小时: ${NODE_TYPES.find(t => t.value === deployForm.nodeType)?.hourlyEarning}
                        </div>
                        <div className="text-xs text-green-300">
                          每天: ${NODE_TYPES.find(t => t.value === deployForm.nodeType)?.dailyEarning}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
