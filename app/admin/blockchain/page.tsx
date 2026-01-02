'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 灵瀚云API配置
const LINGHAN_CONFIG = {
  baseUrl: 'https://lhy.linghanyun.com/oemApi/faDev/common',
  ak: 'cb4e1cc5599d433896bfeb0c94995780',
  as: '37f005ebee964853ae6dc96f8ca28792'
};

// 调用灵瀚云API
async function callLinghanAPI(endpoint: string, method = 'GET', body: any = null) {
  const headers: any = {
    'Content-Type': 'application/json',
    'ak': LINGHAN_CONFIG.ak,
    'as': LINGHAN_CONFIG.as
  };

  const options: any = { method, headers };
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${LINGHAN_CONFIG.baseUrl}${endpoint}`, options);
  return response.json();
}

// 节点类型定义 - 新增灵瀚云
const NODE_TYPES = [
  { value: 'cosmos', label: 'Cosmos Hub', hourlyEarning: 0.22, dailyEarning: 5.20, color: 'blue', type: 'blockchain' },
  { value: 'polygon', label: 'Polygon', hourlyEarning: 0.35, dailyEarning: 8.50, color: 'purple', type: 'blockchain' },
  { value: 'near', label: 'NEAR', hourlyEarning: 0.26, dailyEarning: 6.30, color: 'green', type: 'blockchain' },
  { value: 'sui', label: 'Sui', hourlyEarning: 0.53, dailyEarning: 12.80, color: 'pink', type: 'blockchain' },
  { value: 'linghan', label: '灵瀚云设备', hourlyEarning: 0.0, dailyEarning: 0.0, color: 'orange', type: 'linghan' }, // 收益动态获取
];

export default function BlockchainManagementPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [linghanDevices, setLinghanDevices] = useState<any[]>([]); // 灵瀚云设备列表
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'linghan'>('overview');
  
  const [deployForm, setDeployForm] = useState({
    nodeType: 'cosmos',
    nodeName: '',
    nodeId: '',
    walletAddress: '',
    // 灵瀚云专用字段
    province: '',
    city: '',
    isp: '',
    upBandwidth: '',
    lineNumber: ''
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
      
      // 加载灵瀚云设备
      await loadLinghanDevices();
      
      setLoading(false);
    } catch (err) {
      console.error('加载失败:', err);
      setLoading(false);
    }
  };

  // 加载灵瀚云设备列表
  const loadLinghanDevices = async () => {
    try {
      // 尝试获取设备列表（如果有devIds的话）
      // 由于我们不知道有哪些设备，先设置为空数组
      setLinghanDevices([]);
    } catch (err) {
      console.error('加载灵瀚云设备失败:', err);
    }
  };

  // 获取灵瀚云设备详情
  const getLinghanDeviceDetail = async (devId: string, devType: number) => {
    try {
      const result = await callLinghanAPI(`/detail?devId=${devId}&devType=${devType}`);
      return result;
    } catch (err) {
      console.error('获取设备详情失败:', err);
      return null;
    }
  };

  // 获取灵瀚云设备流量数据
  const getLinghanTraffic = async (uuid: string, date: string, devType: number) => {
    try {
      const result = await callLinghanAPI(`/monitor?uuid=${uuid}&monitorTime=${date}&devType=${devType}`);
      return result;
    } catch (err) {
      console.error('获取流量数据失败:', err);
      return null;
    }
  };

  // 获取灵瀚云设备收益
  const getLinghanBandwidth = async (devId: string) => {
    try {
      const result = await callLinghanAPI(`/bandwidth95/${devId}`);
      return result;
    } catch (err) {
      console.error('获取收益失败:', err);
      return null;
    }
  };

  // 部署任务
  const handleDeploy = async () => {
    if (!selectedMachine || !deployForm.nodeName) {
      alert('请选择机器并填写任务名称');
      return;
    }

    const machine = machines.find(m => m.id === selectedMachine);
    if (!machine) return;

    // 检查是否是灵瀚云类型
    if (deployForm.nodeType === 'linghan') {
      // 部署灵瀚云设备
      await deployLinghanDevice(machine);
    } else {
      // 部署区块链节点
      await deployBlockchainNode(machine);
    }
  };

  // 部署区块链节点
  const deployBlockchainNode = async (machine: any) => {
    const existingTask = nodes.find(
      n => n.machine_id === selectedMachine && n.node_type === deployForm.nodeType
    );
    
    if (existingTask) {
      if (!confirm(`该机器已经部署了 ${NODE_TYPES.find(t => t.value === deployForm.nodeType)?.label} 任务，确定要再部署一个吗？`)) {
        return;
      }
    }

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
        alert('✅ 区块链节点部署成功！');
        await loadData();
        setDeployForm({ 
          nodeType: 'cosmos', 
          nodeName: '', 
          nodeId: '', 
          walletAddress: '',
          province: '',
          city: '',
          isp: '',
          upBandwidth: '',
          lineNumber: ''
        });
      } else {
        alert('❌ 部署失败: ' + result.error);
      }
    } catch (error: any) {
      alert('❌ 部署失败: ' + error.message);
    } finally {
      setDeploying(false);
    }
  };

  // 部署灵瀚云设备
  const deployLinghanDevice = async (machine: any) => {
    if (!deployForm.province || !deployForm.city || !deployForm.isp) {
      alert('请填写灵瀚云设备的省市和运营商信息');
      return;
    }

    setDeploying(true);
    try {
      // 调用灵瀚云API添加设备
      const result = await callLinghanAPI('', 'POST', {
        devId: machine.id.toString(), // 使用机器ID作为设备ID
        province: deployForm.province,
        city: deployForm.city,
        isp: deployForm.isp,
        upBandwidth: parseInt(deployForm.upBandwidth) || 100,
        lineNumber: parseInt(deployForm.lineNumber) || 1,
        devType: 2 // 2=盒子，1=大节点
      });

      if (result.code === 200 || result.code === 0) {
        alert('✅ 灵瀚云设备添加成功！');
        await loadData();
        setDeployForm({ 
          nodeType: 'cosmos', 
          nodeName: '', 
          nodeId: '', 
          walletAddress: '',
          province: '',
          city: '',
          isp: '',
          upBandwidth: '',
          lineNumber: ''
        });
      } else {
        alert('❌ 添加失败: ' + (result.message || result.msg || '未知错误'));
      }
    } catch (error: any) {
      alert('❌ 添加失败: ' + error.message);
    } finally {
      setDeploying(false);
    }
  };

  // 获取机器上已部署的任务类型
  const getMachineNodeTypes = (machineId: number) => {
    return nodes.filter(n => n.machine_id === machineId);
  };

  // 获取机器上缺失的任务类型
  const getMissingNodeTypes = (machineId: number) => {
    const existingTypes = nodes
      .filter(n => n.machine_id === machineId)
      .map(n => n.node_type);
    return NODE_TYPES.filter(type => !existingTypes.includes(type.value));
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

  const selectedMachineData = selectedMachine ? machines.find(m => m.id === selectedMachine) : null;
  const selectedMachineNodes = selectedMachine ? getMachineNodeTypes(selectedMachine) : [];
  const missingNodeTypes = selectedMachine ? getMissingNodeTypes(selectedMachine) : [];

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
          <h1 className="text-3xl font-bold text-white mb-2">区块链 + 灵瀚云 任务管理中心</h1>
          <p className="text-gray-400">管理机器 · 部署任务 · 监控收益</p>
        </div>

        {/* 标签切换 */}
        <div className="flex gap-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 任务总览
          </button>
          <button
            onClick={() => setActiveTab('linghan')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'linghan'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🌐 灵瀚云设备监控
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
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
                              <div className="mt-2 pt-2 border-t border-orange-500/30">
                                <div className="text-xs text-orange-400 font-medium">
                                  💰 可部署全部5种任务类型
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {machines.filter(m => nodes.some(n => n.machine_id === m.id)).map(machine => {
                        const machineNodes = getMachineNodeTypes(machine.id);
                        const missing = getMissingNodeTypes(machine.id);
                        
                        return (
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
                            <div className="grid grid-cols-2 gap-1 text-xs text-gray-300 mb-2">
                              <div>💻 {machine.cpu_cores} 核</div>
                              <div>💾 {machine.memory_gb} GB</div>
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-gray-600">
                              <div className="text-xs text-gray-400 mb-1">已部署任务 ({machineNodes.length}):</div>
                              <div className="flex flex-wrap gap-1">
                                {machineNodes.map(node => {
                                  const nodeType = NODE_TYPES.find(t => t.value === node.node_type);
                                  return (
                                    <span 
                                      key={node.id}
                                      className={`px-2 py-0.5 text-xs rounded ${
                                        nodeType?.color === 'blue' ? 'bg-blue-500/30 text-blue-300' :
                                        nodeType?.color === 'purple' ? 'bg-purple-500/30 text-purple-300' :
                                        nodeType?.color === 'green' ? 'bg-green-500/30 text-green-300' :
                                        nodeType?.color === 'pink' ? 'bg-pink-500/30 text-pink-300' :
                                        'bg-orange-500/30 text-orange-300'
                                      }`}
                                    >
                                      {nodeType?.label}
                                    </span>
                                  );
                                })}
                              </div>
                              
                              {missing.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs text-yellow-400">可部署 ({missing.length}):</div>
                                  <div className="text-xs text-gray-500">
                                    {missing.map(t => t.label).join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

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
                              <div className="font-bold text-white text-lg flex items-center gap-2">
                                {stat.label}
                                {stat.type === 'linghan' && (
                                  <span className="text-xs px-2 py-0.5 bg-orange-500/30 text-orange-300 rounded">
                                    灵瀚云
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400">
                                {stat.totalCount} 台机器 · {stat.runningCount} 运行中
                              </div>
                            </div>
                            <div className="text-right">
                              {stat.type === 'blockchain' ? (
                                <>
                                  <div className="text-2xl font-bold text-green-400">${stat.hourlyTotal}/时</div>
                                  <div className="text-sm text-gray-400">${stat.dailyTotal}/天</div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-400">收益数据在监控面板查看</div>
                              )}
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
                                  {' · '}
                                  {machines.find(m => m.id === node.machine_id)?.machine_name}
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
                      {selectedMachineData && (
                        <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded">
                          <div className="text-sm font-bold text-blue-300 mb-1">选中机器</div>
                          <div className="text-white font-medium">{selectedMachineData.machine_name}</div>
                          <div className="text-xs text-gray-400">{selectedMachineData.ip_address}</div>
                          
                          {selectedMachineNodes.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-blue-500/30">
                              <div className="text-xs text-blue-300 mb-1">已部署:</div>
                              <div className="flex flex-wrap gap-1">
                                {selectedMachineNodes.map(node => {
                                  const nodeType = NODE_TYPES.find(t => t.value === node.node_type);
                                  return (
                                    <span key={node.id} className="px-1.5 py-0.5 bg-blue-500/30 text-blue-200 text-xs rounded">
                                      {nodeType?.label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {missingNodeTypes.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-yellow-300 mb-1">可部署:</div>
                              <div className="text-xs text-gray-400">
                                {missingNodeTypes.map(t => t.label).join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="text-white text-sm mb-2 block">选择机器</label>
                        <select 
                          className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                          value={selectedMachine || ''}
                          onChange={(e) => setSelectedMachine(Number(e.target.value))}
                        >
                          <option value="">请选择机器</option>
                          {machines.map(m => {
                            const nodeCount = nodes.filter(n => n.machine_id === m.id).length;
                            return (
                              <option key={m.id} value={m.id}>
                                {m.machine_name} ({m.ip_address}) {nodeCount > 0 ? `[${nodeCount}个任务]` : '[空闲]'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="text-white text-sm mb-2 block">任务类型</label>
                        <select 
                          className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                          value={deployForm.nodeType}
                          onChange={(e) => setDeployForm({...deployForm, nodeType: e.target.value})}
                        >
                          {NODE_TYPES.map(type => {
                            const alreadyDeployed = selectedMachine && nodes.some(
                              n => n.machine_id === selectedMachine && n.node_type === type.value
                            );
                            return (
                              <option key={type.value} value={type.value}>
                                {type.label} {type.type === 'linghan' ? '🌐' : `($${type.hourlyEarning}/时)`} {alreadyDeployed ? '✓已部署' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* 区块链节点字段 */}
                      {deployForm.nodeType !== 'linghan' && (
                        <>
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
                        </>
                      )}

                      {/* 灵瀚云设备字段 */}
                      {deployForm.nodeType === 'linghan' && (
                        <>
                          <div>
                            <label className="text-white text-sm mb-2 block">设备名称</label>
                            <input
                              type="text"
                              placeholder="例如: 灵瀚设备-001"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.nodeName}
                              onChange={(e) => setDeployForm({...deployForm, nodeName: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">省份</label>
                            <input
                              type="text"
                              placeholder="例如: 广东"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.province}
                              onChange={(e) => setDeployForm({...deployForm, province: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">城市</label>
                            <input
                              type="text"
                              placeholder="例如: 深圳"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.city}
                              onChange={(e) => setDeployForm({...deployForm, city: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">运营商</label>
                            <select
                              className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                              value={deployForm.isp}
                              onChange={(e) => setDeployForm({...deployForm, isp: e.target.value})}
                            >
                              <option value="">请选择运营商</option>
                              <option value="电信">电信</option>
                              <option value="联通">联通</option>
                              <option value="移动">移动</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">上行带宽 (Mbps)</label>
                            <input
                              type="number"
                              placeholder="例如: 100"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.upBandwidth}
                              onChange={(e) => setDeployForm({...deployForm, upBandwidth: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">线路数量</label>
                            <input
                              type="number"
                              placeholder="例如: 1"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.lineNumber}
                              onChange={(e) => setDeployForm({...deployForm, lineNumber: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      <button 
                        onClick={handleDeploy}
                        disabled={!selectedMachine || !deployForm.nodeName || deploying}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deploying ? '部署中...' : deployForm.nodeType === 'linghan' ? '添加灵瀚云设备' : '立即部署任务'}
                      </button>

                      {deployForm.nodeType !== 'linghan' && (
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

                      {deployForm.nodeType === 'linghan' && (
                        <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded">
                          <div className="text-sm text-white">
                            <div className="font-bold mb-1">💡 灵瀚云设备说明</div>
                            <div className="text-xs text-gray-300">
                              • 设备添加后可在"灵瀚云设备监控"标签页查看详情
                            </div>
                            <div className="text-xs text-gray-300">
                              • 收益数据会自动同步
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {activeTab === 'linghan' && (
          <div className="text-center text-white py-20">
            <div className="text-6xl mb-4">🌐</div>
            <h2 className="text-2xl font-bold mb-2">灵瀚云设备监控面板</h2>
            <p className="text-gray-400 mb-6">正在开发中...</p>
            <p className="text-sm text-gray-500">此功能将显示：设备详情、流量图表、收益统计、网卡信息等</p>
          </div>
        )}

      </div>
    </div>
  );
}
