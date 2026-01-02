'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 灵瀚云API配置
const LINGHAN_CONFIG = {
  baseUrl: 'https://lhy.linghanyun.com/oemApi/faDev/common',
  ak: 'cb4e1cc5599d433896bfeb0c94995780',
  as: '37f005ebee964853ae6dc96f8ca28792',
  // 已绑定的机器码列表
  deviceIds: [
    "902f4cdd53f7bb2648f5c889cd619ea0",
    "87210372d2ddcbff8ee16a67f2202fb4",
    "45b1409ac125b2f755153846c33c97e8",
    "0b0e8e9ee416bfa14ee79448df0c65cd",
    "67ee6dbedb3ce054c4afce3a448d2487",
    "8270e97698cadf622c5ff615c9391d84",
    "5aa8e72a0e42e967ec3a1785378fe79d",
    "1f075dad24e5a97b927ceac4462ee665",
    "38ea4444beb10a02e95ecd9ed09746e7",
    "008c4a9a7e36cc4f4a0931afcf42abc6",
    "79b9f541c06c733bdb095850158e4804",
    "150873b1f0aab4b1b9b0d3a72ce40eb3",
    "4074455e1ed475f21ac6e86a0bd9690f"
  ]
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

  try {
    const response = await fetch(`${LINGHAN_CONFIG.baseUrl}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error('灵瀚云API调用失败:', error);
    return { code: 500, message: '网络错误' };
  }
}

// 节点类型定义
const NODE_TYPES = [
  { value: 'cosmos', label: 'Cosmos Hub', hourlyEarning: 0.22, dailyEarning: 5.20, color: 'blue', type: 'blockchain' },
  { value: 'polygon', label: 'Polygon', hourlyEarning: 0.35, dailyEarning: 8.50, color: 'purple', type: 'blockchain' },
  { value: 'near', label: 'NEAR', hourlyEarning: 0.26, dailyEarning: 6.30, color: 'green', type: 'blockchain' },
  { value: 'sui', label: 'Sui', hourlyEarning: 0.53, dailyEarning: 12.80, color: 'pink', type: 'blockchain' },
  { value: 'linghan', label: '灵瀚云设备', hourlyEarning: 0.0, dailyEarning: 0.0, color: 'orange', type: 'linghan' },
];

export default function BlockchainManagementPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [linghanDevices, setLinghanDevices] = useState<any[]>([]);
  const [linghanAssignedDevices, setLinghanAssignedDevices] = useState<string[]>([]); // 已分配任务的设备ID
  const [selectedLinghanDevice, setSelectedLinghanDevice] = useState<any>(null);
  const [linghanDeviceDetail, setLinghanDeviceDetail] = useState<any>(null);
  const [linghanNetworkCards, setLinghanNetworkCards] = useState<any[]>([]);
  const [linghanTrafficData, setLinghanTrafficData] = useState<any>(null);
  const [linghanBandwidth, setLinghanBandwidth] = useState<any>(null);
  const [linghanDialingInfo, setLinghanDialingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [selectedLinghanDevId, setSelectedLinghanDevId] = useState<string>(''); // 选中的灵瀚云设备ID
  const [activeTab, setActiveTab] = useState<'overview' | 'linghan'>('overview');
  const [linghanLoading, setLinghanLoading] = useState(false);
  
  const [deployForm, setDeployForm] = useState({
    nodeType: 'cosmos',
    nodeName: '',
    nodeId: '',
    walletAddress: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'linghan') {
      loadLinghanDevices();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedLinghanDevice) {
      loadLinghanDeviceDetails();
    }
  }, [selectedLinghanDevice]);

  const loadData = async () => {
    try {
      const [machinesRes, nodesRes] = await Promise.all([
        fetch('/api/admin/blockchain/machines'),
        fetch('/api/admin/blockchain/nodes'),
      ]);

      const machinesData = await machinesRes.json();
      const nodesData = await nodesRes.json();

      if (machinesData.success) setMachines(machinesData.data || []);
      if (nodesData.success) {
        setNodes(nodesData.data || []);
        // 提取已分配任务的灵瀚云设备ID
        const assignedIds = nodesData.data
          .filter((n: any) => n.node_type === 'linghan')
          .map((n: any) => n.node_id);
        setLinghanAssignedDevices(assignedIds);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('加载失败:', err);
      setLoading(false);
    }
  };

  // 加载灵瀚云所有设备
  const loadLinghanDevices = async () => {
    setLinghanLoading(true);
    
    try {
      // 批量获取所有已绑定设备的详情
      const result = await callLinghanAPI('/getDevListInfo', 'POST', { 
        devIds: LINGHAN_CONFIG.deviceIds 
      });
      
      if (result.code === 200 || result.code === 0) {
        setLinghanDevices(result.data || []);
      } else {
        console.error('获取设备列表失败:', result.message);
        setLinghanDevices([]);
      }
    } catch (err) {
      console.error('加载灵瀚云设备失败:', err);
      setLinghanDevices([]);
    }
    
    setLinghanLoading(false);
  };

  // 加载灵瀚云设备详细信息
  const loadLinghanDeviceDetails = async () => {
    if (!selectedLinghanDevice) return;

    const devId = selectedLinghanDevice.devId;
    const devType = selectedLinghanDevice.devType || 2;

    setLinghanLoading(true);

    try {
      // 1. 获取设备详情
      const detailResult = await callLinghanAPI(`/detail?devId=${devId}&devType=${devType}`);
      if (detailResult.code === 200 || detailResult.code === 0) {
        setLinghanDeviceDetail(detailResult.data);
      }

      // 2. 获取网卡信息
      const interfacesResult = await callLinghanAPI(`/interfaces?devId=${devId}`);
      if (interfacesResult.code === 200 || interfacesResult.code === 0) {
        setLinghanNetworkCards(interfacesResult.data || []);
      }

      // 3. 获取流量数据
      const today = new Date().toISOString().split('T')[0];
      const trafficResult = await callLinghanAPI(`/monitor?uuid=${devId}&monitorTime=${today}&devType=${devType}`);
      if (trafficResult.code === 200 || trafficResult.code === 0) {
        setLinghanTrafficData(trafficResult.data);
      }

      // 4. 获取95带宽收益
      const bandwidthResult = await callLinghanAPI(`/bandwidth95/${devId}`);
      if (bandwidthResult.code === 200 || bandwidthResult.code === 0) {
        setLinghanBandwidth(bandwidthResult.data);
      }

      // 5. 获取拨号信息（仅大节点）
      if (devType === 1) {
        const dialingResult = await callLinghanAPI(`/getDialingInfo/${devId}`);
        if (dialingResult.code === 200 || dialingResult.code === 0) {
          setLinghanDialingInfo(dialingResult.data);
        }
      }

    } catch (err) {
      console.error('加载设备详情失败:', err);
    }

    setLinghanLoading(false);
  };

  const handleDeploy = async () => {
    if (!selectedMachine || !deployForm.nodeName) {
      alert('请选择机器并填写任务名称');
      return;
    }

    const machine = machines.find(m => m.id === selectedMachine);
    if (!machine) return;

    if (deployForm.nodeType === 'linghan') {
      await deployLinghanDevice(machine);
    } else {
      await deployBlockchainNode(machine);
    }
  };

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
        resetForm();
      } else {
        alert('❌ 部署失败: ' + result.error);
      }
    } catch (error: any) {
      alert('❌ 部署失败: ' + error.message);
    } finally {
      setDeploying(false);
    }
  };

  // 分配灵瀚云设备任务
  const deployLinghanDevice = async (machine: any) => {
    if (!selectedLinghanDevId) {
      alert('请选择一台灵瀚云设备');
      return;
    }

    setDeploying(true);
    try {
      // 直接在数据库中记录任务分配
      const response = await fetch('/api/admin/blockchain/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName: deployForm.nodeName,
          nodeType: 'linghan',
          nodeId: selectedLinghanDevId, // 使用灵瀚云设备ID
          machineId: selectedMachine,
          walletAddress: '',
          serverIp: machine.ip_address,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ 灵瀚云设备任务分配成功！');
        await loadData();
        resetForm();
        setSelectedLinghanDevId('');
      } else {
        alert('❌ 分配失败: ' + result.error);
      }
    } catch (error: any) {
      alert('❌ 分配失败: ' + error.message);
    } finally {
      setDeploying(false);
    }
  };

  const resetForm = () => {
    setDeployForm({ 
      nodeType: 'cosmos', 
      nodeName: '', 
      nodeId: '', 
      walletAddress: '',
    });
  };

  const getMachineNodeTypes = (machineId: number) => {
    return nodes.filter(n => n.machine_id === machineId);
  };

  const getMissingNodeTypes = (machineId: number) => {
    const existingTypes = nodes
      .filter(n => n.machine_id === machineId)
      .map(n => n.node_type);
    return NODE_TYPES.filter(type => !existingTypes.includes(type.value));
  };

  const pendingMachines = machines.filter(m => 
    m.status === 'active' && nodes.filter(n => n.machine_id === m.id).length === 0
  );

  // 待分配的灵瀚云设备（已绑定但未分配任务）
  const pendingLinghanDevices = linghanDevices.filter(
    dev => !linghanAssignedDevices.includes(dev.devId)
  );

  // 已分配的灵瀚云设备
  const assignedLinghanDevices = linghanDevices.filter(
    dev => linghanAssignedDevices.includes(dev.devId)
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
    totalLinghanDevices: linghanDevices.length,
    pendingLinghanDevices: pendingLinghanDevices.length,
    assignedLinghanDevices: assignedLinghanDevices.length,
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
            {stats.pendingLinghanDevices > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded">
                {stats.pendingLinghanDevices} 待分配
              </span>
            )}
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
                      <div className="text-sm text-gray-400">本地机器</div>
                      <div className="text-xs text-green-400">{stats.availableMachines} 可用</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <div>
                      <div className="text-2xl font-bold text-white">{stats.totalLinghanDevices}</div>
                      <div className="text-sm text-gray-400">灵瀚云设备</div>
                      <div className="text-xs text-orange-400">{stats.pendingLinghanDevices} 待分配</div>
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

              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 col-span-1 md:col-span-3">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-white">${stats.totalDaily} / 日 · ${(parseFloat(stats.totalDaily) * 30).toFixed(2)} / 月</div>
                      <div className="text-sm text-gray-400">区块链节点收益预计（灵瀚云收益见监控页）</div>
                      <div className="text-xs text-purple-400">基于当前运行任务</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 三列布局 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 左侧：机器列表（省略，与之前一致） */}
              <div className="lg:col-span-4">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">本地机器列表 ({machines.length})</CardTitle>
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

                      {machines.filter(m => nodes.some(n => n.machine_id === m.id)).map(machine => {
                        const machineNodes = getMachineNodeTypes(machine.id);
                        
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

              {/* 中间：任务统计（省略） */}
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
                                {stat.totalCount} 个任务 · {stat.runningCount} 运行中
                              </div>
                            </div>
                            <div className="text-right">
                              {stat.type === 'blockchain' ? (
                                <>
                                  <div className="text-2xl font-bold text-green-400">${stat.hourlyTotal}/时</div>
                                  <div className="text-sm text-gray-400">${stat.dailyTotal}/天</div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-400">收益见监控面板</div>
                              )}
                            </div>
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
                    <CardTitle className="text-white">
                      {deployForm.nodeType === 'linghan' ? '分配灵瀚云任务' : '部署新任务'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedMachineData && (
                        <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded">
                          <div className="text-sm font-bold text-blue-300 mb-1">选中本地机器</div>
                          <div className="text-white font-medium">{selectedMachineData.machine_name}</div>
                          <div className="text-xs text-gray-400">{selectedMachineData.ip_address}</div>
                        </div>
                      )}

                      <div>
                        <label className="text-white text-sm mb-2 block">选择本地机器</label>
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
                          {NODE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label} {type.type === 'linghan' ? '🌐' : `($${type.hourlyEarning}/时)`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {deployForm.nodeType !== 'linghan' ? (
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
                      ) : (
                        <>
                          <div>
                            <label className="text-white text-sm mb-2 block">任务名称</label>
                            <input
                              type="text"
                              placeholder="例如: 灵瀚任务-001"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.nodeName}
                              onChange={(e) => setDeployForm({...deployForm, nodeName: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">
                              选择灵瀚云设备 
                              <span className="text-orange-400 ml-2">({pendingLinghanDevices.length} 台待分配)</span>
                            </label>
                            <select
                              className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                              value={selectedLinghanDevId}
                              onChange={(e) => setSelectedLinghanDevId(e.target.value)}
                            >
                              <option value="">请选择灵瀚云设备</option>
                              {pendingLinghanDevices.map(dev => (
                                <option key={dev.devId} value={dev.devId}>
                                  {dev.province} {dev.isp} - {dev.upBandwidth}Mbps {dev.onlineStatus === 1 ? '🟢' : '🔴'}
                                </option>
                              ))}
                            </select>
                            <div className="text-xs text-gray-400 mt-1">
                              💡 这些设备已在灵瀚云绑定，选择后分配任务即可
                            </div>
                          </div>
                        </>
                      )}

                      <button 
                        onClick={handleDeploy}
                        disabled={!selectedMachine || !deployForm.nodeName || deploying || (deployForm.nodeType === 'linghan' && !selectedLinghanDevId)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deploying ? '处理中...' : deployForm.nodeType === 'linghan' ? '分配灵瀚云任务' : '立即部署任务'}
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* 灵瀚云监控标签页 - 内容省略，保持与之前一致 */}
        {activeTab === 'linghan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>灵瀚云设备列表 ({linghanDevices.length})</span>
                    <button
                      onClick={loadLinghanDevices}
                      className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                    >
                      🔄 刷新
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {linghanLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                      <div className="text-gray-400 text-sm">加载中...</div>
                    </div>
                  ) : linghanDevices.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-4">📭</div>
                      <div className="text-lg mb-2">暂无灵瀚云设备</div>
                      <div className="text-sm text-gray-400">请联系管理员绑定设备</div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {/* 待分配设备 */}
                      {pendingLinghanDevices.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-bold text-orange-400 mb-2">
                            ⚠️ 待分配任务 ({pendingLinghanDevices.length})
                          </div>
                          {pendingLinghanDevices.map((device) => (
                            <div
                              key={device.devId}
                              onClick={() => setSelectedLinghanDevice(device)}
                              className={`p-4 mb-2 rounded-lg cursor-pointer transition-all border-2 ${
                                selectedLinghanDevice?.devId === device.devId
                                  ? 'bg-orange-500/30 border-orange-500'
                                  : 'bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-bold text-white">
                                    {device.province} {device.isp}
                                  </div>
                                  <div className="text-xs text-gray-400">{device.devId.substring(0, 16)}...</div>
                                </div>
                                <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">
                                  待分配
                                </span>
                              </div>
                              <div className="space-y-1 text-xs text-gray-300">
                                <div>⚡ {device.upBandwidth || 0} Mbps</div>
                                <div>类型: {device.devType === 1 ? '大节点' : '盒子'}</div>
                                <div>{device.onlineStatus === 1 ? '🟢 在线' : '🔴 离线'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 已分配设备 */}
                      {assignedLinghanDevices.length > 0 && (
                        <div>
                          <div className="text-sm font-bold text-green-400 mb-2">
                            ✅ 已分配任务 ({assignedLinghanDevices.length})
                          </div>
                          {assignedLinghanDevices.map((device) => (
                            <div
                              key={device.devId}
                              onClick={() => setSelectedLinghanDevice(device)}
                              className={`p-4 mb-2 rounded-lg cursor-pointer transition-all border ${
                                selectedLinghanDevice?.devId === device.devId
                                  ? 'bg-green-500/30 border-green-500'
                                  : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-bold text-white">
                                    {device.province} {device.isp}
                                  </div>
                                  <div className="text-xs text-gray-400">{device.devId.substring(0, 16)}...</div>
                                </div>
                                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                                  运行中
                                </span>
                              </div>
                              <div className="space-y-1 text-xs text-gray-300">
                                <div>⚡ {device.upBandwidth || 0} Mbps</div>
                                <div>类型: {device.devType === 1 ? '大节点' : '盒子'}</div>
                                <div>{device.onlineStatus === 1 ? '🟢 在线' : '🔴 离线'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右侧设备详情 - 省略，保持与之前一致 */}
            <div className="lg:col-span-8">
              {!selectedLinghanDevice ? (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-20 text-center">
                    <div className="text-6xl mb-4">👈</div>
                    <div className="text-white text-xl mb-2">请选择一个设备</div>
                    <div className="text-gray-400">点击左侧设备查看详细信息</div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-white py-20">
                  <div className="text-4xl mb-4">🔧</div>
                  <div className="text-xl mb-2">设备详情面板</div>
                  <div className="text-gray-400">功能开发中...</div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
