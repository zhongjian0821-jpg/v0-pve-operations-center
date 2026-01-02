'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Server, Activity, DollarSign, Cpu, HardDrive } from 'lucide-react';

export default function BlockchainManagementPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [deployForm, setDeployForm] = useState({
    taskType: 'cosmos',
    taskName: '',
    nodeId: '',
    walletAddress: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [machinesRes, tasksRes] = await Promise.all([
        fetch('/api/admin/blockchain/machines'),
        fetch('/api/admin/blockchain/nodes')
      ]);
      
      const machinesData = await machinesRes.json();
      const tasksData = await tasksRes.json();
      
      if (machinesData.success) setMachines(machinesData.data || []);
      if (tasksData.success) setTasks(tasksData.data || []);
    } catch (err) {
      console.error('加载失败:', err);
    }
  };

  const nodeTypes = [
    { value: 'cosmos', label: 'Cosmos Hub', hourly: 0.22, daily: 5.20 },
    { value: 'polygon', label: 'Polygon', hourly: 0.35, daily: 8.50 },
    { value: 'near', label: 'NEAR', hourly: 0.26, daily: 6.30 },
    { value: 'sui', label: 'Sui', hourly: 0.53, daily: 12.80 }
  ];

  const stats = {
    totalMachines: machines.length,
    totalTasks: tasks.length,
    runningTasks: tasks.filter(t => t.status === 'running').length,
    totalHourly: tasks.filter(t => t.status === 'running').reduce((sum, t) => {
      const type = nodeTypes.find(nt => nt.value === t.node_type);
      return sum + (type?.hourly || 0);
    }, 0).toFixed(2),
    totalDaily: (parseFloat(stats?.totalHourly || '0') * 24).toFixed(2)
  };

  const handleDeploy = async () => {
    if (!selectedMachine || !deployForm.taskName) {
      alert('请选择机器并填写任务名称');
      return;
    }

    const machine = machines.find(m => m.id === selectedMachine);
    if (!machine) return;

    try {
      const response = await fetch('/api/admin/blockchain/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName: deployForm.taskName,
          nodeType: deployForm.taskType,
          nodeId: deployForm.nodeId,
          machineId: selectedMachine,
          walletAddress: deployForm.walletAddress,
          serverIp: machine.ip_address,
          sshPort: machine.ssh_port,
          sshUser: machine.ssh_user,
          sshPassword: machine.ssh_password
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ 部署成功！');
        loadData();
        setDeployForm({ taskType: 'cosmos', taskName: '', nodeId: '', walletAddress: '' });
        setSelectedMachine(null);
      } else {
        alert('❌ 部署失败: ' + result.error);
      }
    } catch (error: any) {
      alert('❌ 部署失败: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">区块链任务管理中心</h1>
          <p className="text-gray-400">管理机器 · 部署任务 · 监控收益</p>
        </div>

        {/* 顶部统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="bg-blue-500/20 border-blue-500/30 p-4">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalMachines}</div>
                <div className="text-sm text-gray-400">总机器数</div>
              </div>
            </div>
          </Card>

          <Card className="bg-green-500/20 border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalTasks}</div>
                <div className="text-sm text-gray-400">总任务数</div>
                <div className="text-xs text-green-400">{stats.runningTasks} 运行中</div>
              </div>
            </div>
          </Card>

          <Card className="bg-yellow-500/20 border-yellow-500/30 p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">${stats.totalHourly}</div>
                <div className="text-sm text-gray-400">每小时收益</div>
              </div>
            </div>
          </Card>

          <Card className="bg-purple-500/20 border-purple-500/30 p-4 col-span-3">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">${stats.totalDaily}</div>
                <div className="text-sm text-gray-400">每日收益 · 月度预计: ${(parseFloat(stats.totalDaily) * 30).toFixed(2)}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* 三列布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左侧：机器列表 */}
          <div className="lg:col-span-4">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">机器列表 ({machines.length})</h2>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {machines.map(machine => {
                  const machineTasks = tasks.filter(t => t.machine_id === machine.id);
                  const isPending = machineTasks.length === 0;
                  
                  return (
                    <Card 
                      key={machine.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedMachine === machine.id
                          ? 'bg-blue-500/30 border-blue-500'
                          : isPending
                          ? 'bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20'
                          : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                      }`}
                      onClick={() => setSelectedMachine(machine.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-white">{machine.machine_name}</div>
                          <div className="text-sm text-gray-400">{machine.ip_address}</div>
                        </div>
                        {isPending && (
                          <Badge className="bg-orange-500">待部署</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                        <div className="flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          {machine.cpu_cores} 核
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {machine.memory_gb} GB
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <div className="text-xs text-gray-400">
                          运行任务: {machineTasks.length} 个
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* 中间：任务统计 */}
          <div className="lg:col-span-5">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">任务类型统计</h2>

              <div className="space-y-4">
                {nodeTypes.map(type => {
                  const typeTasks = tasks.filter(t => t.node_type === type.value);
                  const running = typeTasks.filter(t => t.status === 'running').length;
                  
                  return (
                    <Card key={type.value} className="bg-gray-700/30 border-gray-600 p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{type.label}</div>
                          <div className="text-sm text-gray-400">
                            {typeTasks.length} 台机器 · {running} 运行中
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">
                            ${(running * type.hourly).toFixed(2)}/时
                          </div>
                          <div className="text-sm text-gray-400">
                            ${(running * type.daily).toFixed(2)}/天
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <h3 className="text-lg font-bold text-white mt-6 mb-3">所有运行任务</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {tasks.map(task => (
                  <Card key={task.id} className="bg-gray-700/30 border-gray-600 p-3">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium text-white">{task.task_name}</div>
                        <div className="text-xs text-gray-400">
                          {nodeTypes.find(nt => nt.value === task.node_type)?.label}
                        </div>
                      </div>
                      <Badge className={
                        task.status === 'running' ? 'bg-green-500' :
                        task.status === 'stopped' ? 'bg-yellow-500' : 'bg-red-500'
                      }>
                        {task.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          {/* 右侧：部署表单 */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800/50 border-gray-700 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-white mb-4">部署新任务</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">任务类型</label>
                  <select 
                    className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                    value={deployForm.taskType}
                    onChange={(e) => setDeployForm({...deployForm, taskType: e.target.value})}
                  >
                    {nodeTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} (${type.hourly}/时)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">任务名称</label>
                  <Input
                    placeholder="例如: validator-1"
                    className="bg-gray-700 border-gray-600 text-white"
                    value={deployForm.taskName}
                    onChange={(e) => setDeployForm({...deployForm, taskName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Node ID</label>
                  <Input
                    placeholder="例如: node-001"
                    className="bg-gray-700 border-gray-600 text-white"
                    value={deployForm.nodeId}
                    onChange={(e) => setDeployForm({...deployForm, nodeId: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">钱包地址</label>
                  <Input
                    placeholder="例如: cosmos1abc..."
                    className="bg-gray-700 border-gray-600 text-white"
                    value={deployForm.walletAddress}
                    onChange={(e) => setDeployForm({...deployForm, walletAddress: e.target.value})}
                  />
                </div>

                <Button 
                  onClick={handleDeploy}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  disabled={!selectedMachine || !deployForm.taskName}
                >
                  立即部署任务
                </Button>

                {deployForm.taskType && (
                  <Card className="bg-green-500/20 border-green-500/30 p-3">
                    <div className="text-sm text-white">
                      <div className="font-bold mb-1">预计收益</div>
                      <div className="text-xs text-green-300">
                        每小时: ${nodeTypes.find(t => t.value === deployForm.taskType)?.hourly}
                      </div>
                      <div className="text-xs text-green-300">
                        每天: ${nodeTypes.find(t => t.value === deployForm.taskType)?.daily}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
