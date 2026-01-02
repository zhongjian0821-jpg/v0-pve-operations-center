'use client';

// 计算灵瀚云流量数据
function calculateLinghanTraffic(apiData: any) {
  if (!apiData || !apiData.upList || !apiData.downList) {
    return { totalTraffic: 0, inTraffic: 0, outTraffic: 0 };
  }
  
  // upList/downList 单位是 Mbps，每个数据点代表5分钟的平均速率
  // 计算总流量：速率(Mbps) * 时间(300秒) / 8(bit转byte) = MB
  const upTotal = apiData.upList.reduce((sum: number, val: string) => sum + parseFloat(val || '0'), 0);
  const downTotal = apiData.downList.reduce((sum: number, val: string) => sum + parseFloat(val || '0'), 0);
  
  // Mbps * 300s / 8 = MB
  const upTrafficMB = (upTotal * 300) / 8;
  const downTrafficMB = (downTotal * 300) / 8;
  
  return {
    totalTraffic: upTrafficMB + downTrafficMB,  // MB
    inTraffic: downTrafficMB,                     // MB
    outTraffic: upTrafficMB                       // MB
  };
}


import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 灵瀚云API配置
const LINGHAN_CONFIG = {
  baseUrl: 'https://lhy.linghanyun.com/oemApi/faDev/common',
  ak: 'cb4e1cc5599d433896bfeb0c94995780',
  as: '37f005ebee964853ae6dc96f8ca28792'
};

// 调用灵瀚云API（通过后端代理）
async function callLinghanAPI(endpoint: string, method = 'GET', body: any = null) {
  try {
    const response = await fetch('/api/linghan/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint,
        method,
        data: body
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.error('代理API错误:', result.error);
      return { code: 500, message: result.error };
    }
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


      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">批量导入灵瀚云设备</h3>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setDeviceIdsInput('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                设备ID列表
                <span className="text-gray-500 ml-2 text-xs">
                  (每行一个ID，或用逗号/空格分隔)
                </span>
              </label>
              <textarea
                value={deviceIdsInput}
                onChange={(e) => setDeviceIdsInput(e.target.value)}
                placeholder="请输入设备ID，例如:\n4074445e\n150873b1\n79b9f541\n008c4a9a\n\n或者用逗号分隔：4074445e, 150873b1, 79b9f541"
                className="w-full h-64 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                style={{ resize: 'vertical' }}
              />
              <div className="mt-2 text-sm text-gray-400">
                {deviceIdsInput.split(/[\n,\s]+/).filter(id => id.trim().length > 0).length} 个设备ID
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImportLinghanDevices}
                disabled={importing || !deviceIdsInput.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {importing ? '导入中...' : '确认导入'}
              </button>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setDeviceIdsInput('');
                }}
                disabled={importing}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:cursor-not-allowed"
              >
                取消
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-900 rounded text-sm text-gray-400">
              <div className="font-medium text-gray-300 mb-1">💡 使用说明：</div>
              <ul className="list-disc list-inside space-y-1">
                <li>每行输入一个设备ID</li>
                <li>也可以用逗号、空格分隔多个ID</li>
                <li>系统会自动去重和验证</li>
                <li>已存在的设备将被跳过</li>
              </ul>
            </div>
          </div>
        </div>
      )}


      {/* 批量导入设备ID对话框 */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">批量导入灵瀚云设备</h3>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setDeviceIdsInput('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                设备ID列表
                <span className="text-gray-500 ml-2 text-xs">
                  (每行一个ID，或用逗号/空格分隔)
                </span>
              </label>
              <textarea
                value={deviceIdsInput}
                onChange={(e) => setDeviceIdsInput(e.target.value)}
                placeholder="请输入设备ID，例如:\n4074445e\n150873b1\n79b9f541\n008c4a9a\n\n或者用逗号分隔：4074445e, 150873b1, 79b9f541"
                className="w-full h-64 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
              <div className="mt-2 text-sm text-gray-400">
                {deviceIdsInput.split(/[\n,\s]+/).filter(id => id.trim().length > 0).length} 个设备ID
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImportLinghanDevices}
                disabled={importing || !deviceIdsInput.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {importing ? '导入中...' : '确认导入'}
              </button>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setDeviceIdsInput('');
                }}
                disabled={importing}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:cursor-not-allowed"
              >
                取消
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-900 rounded text-sm text-gray-400">
              <div className="font-medium text-gray-300 mb-1">💡 使用说明：</div>
              <ul className="list-disc list-inside space-y-1">
                <li>每行输入一个设备ID</li>
                <li>也可以用逗号、空格分隔多个ID</li>
                <li>系统会自动去重和验证</li>
                <li>已存在的设备将被跳过</li>
              </ul>
            </div>
          </div>
        </div>
      )}

export default function BlockchainManagementPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]); // 待分配任务
  const [showPendingModal, setShowPendingModal] = useState(false); // 显示待分配任务弹窗
  const [selectedPendingTask, setSelectedPendingTask] = useState<any>(null); // 选中的待分配任务
  const [assigningMachine, setAssigningMachine] = useState<number | null>(null); // 要分配的机器
  const [linghanDevices, setLinghanDevices] = useState<any[]>([]);
  const [selectedLinghanDevice, setSelectedLinghanDevice] = useState<any>(null);
  const [linghanDeviceDetail, setLinghanDeviceDetail] = useState<any>(null);
  const [linghanNetworkCards, setLinghanNetworkCards] = useState<any[]>([]);
  const [linghanTrafficData, setLinghanTrafficData] = useState<any>(null);
  const [linghanBandwidth, setLinghanBandwidth] = useState<any>(null);
  const [linghanDialingInfo, setLinghanDialingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'linghan'>('overview');
  const [linghanLoading, setLinghanLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deviceIdsInput, setDeviceIdsInput] = useState('');
  
  const [deployForm, setDeployForm] = useState({
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
      const [machinesRes, nodesRes, pendingRes] = await Promise.all([
        fetch('/api/admin/blockchain/machines'),
        fetch('/api/admin/blockchain/nodes'),
        fetch('/api/admin/blockchain/pending-tasks'), // 新增：获取待分配任务
      ]);

      const machinesData = await machinesRes.json();
      const nodesData = await nodesRes.json();
      const pendingData = await pendingRes.json();

      if (machinesData.success) setMachines(machinesData.data || []);
      if (nodesData.success) setNodes(nodesData.data || []);
      if (pendingData.success) setPendingTasks(pendingData.data || []);
      
      setLoading(false);
    } catch (err) {
      console.error('加载失败:', err);
      setLoading(false);
    }
  };

  // 分配任务到机器
  const handleAssignTask = async () => {
    if (!selectedPendingTask || !assigningMachine) {
      alert('请选择要分配的机器');
      return;
    }

    setDeploying(true);
    try {
      const response = await fetch('/api/admin/blockchain/assign-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedPendingTask.id,
          machineId: assigningMachine,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ 任务分配成功！');
        setShowPendingModal(false);
        setSelectedPendingTask(null);
        setAssigningMachine(null);
        await loadData();
      } else {
        alert('❌ 分配失败: ' + result.error);
      }
    } catch (error: any) {
      alert('❌ 分配失败: ' + error.message);
    } finally {
      setDeploying(false);
    }
  };

  // 加载灵瀚云设备列表
  const loadLinghanDevices = async () => {
    setLinghanLoading(true);
    
    // 获取所有灵瀚云类型的节点
    const linghanNodes = nodes.filter(n => n.node_type === 'linghan');
    
    if (linghanNodes.length === 0) {
      setLinghanDevices([]);
      setLinghanLoading(false);
      return;
    }

    try {
      // 从config中提取device_id
      const devIds = linghanNodes.map(n => {
        try {
          const config = typeof n.config === 'string' ? JSON.parse(n.config) : n.config;
          return config.device_id || n.machine_id.toString();
        } catch {
          return n.machine_id.toString();
        }
      }).filter(Boolean);
      
      // 批量获取设备详情
      const result = await callLinghanAPI('/getDevListInfo', 'POST', { devIds });
      
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

    const devId = selectedLinghanDevice.devId || selectedLinghanDevice.uuid;
    const devType = selectedLinghanDevice.devType || 2;

    console.log('🔍 加载设备详情:', devId);
    setLinghanLoading(true);

    try {
      // 1. 获取设备详情
      const detailResult = await callLinghanAPI(`/detail?devId=${devId}&devType=${devType}`);
      console.log('设备详情:', detailResult);
      if (detailResult.code === 200 || detailResult.code === 0) {
        setLinghanDeviceDetail(detailResult.data);
      } else {
        // 如果detail API失败，使用设备列表中的信息
        console.log('detail API失败，使用设备列表信息');
        setLinghanDeviceDetail(selectedLinghanDevice);
      }

      // 2. 获取网卡信息
      const interfacesResult = await callLinghanAPI(`/interfaces?devId=${devId}`);
      if (interfacesResult.code === 200 || interfacesResult.code === 0) {
        setLinghanNetworkCards(interfacesResult.data || []);
      }

      // 3. 获取流量数据（今天）
      const today = new Date().toISOString().split('T')[0];
      const trafficResult = await callLinghanAPI(`/monitor?uuid=${devId}&monitorTime=${today}&devType=${devType}`);
      console.log('流量数据原始响应:', trafficResult);
      
      if ((trafficResult.code === 200 || trafficResult.code === 0) && trafficResult.data) {
        // 计算流量总和
        const calculatedTraffic = calculateLinghanTraffic(trafficResult.data);
        console.log('计算后的流量数据:', calculatedTraffic);
        setLinghanTrafficData(calculatedTraffic);
      } else {
        // 设置默认值避免NaN
        console.warn('流量数据为空，使用默认值');
        setLinghanTrafficData({ totalTraffic: 0, inTraffic: 0, outTraffic: 0 });
      }

      // 4. 获取95带宽收益
      const bandwidthResult = await callLinghanAPI(`/bandwidth95/${devId}`);
      console.log('带宽收益原始响应:', bandwidthResult);
      
      // bandwidth95 API直接返回数据对象，没有code包装
      if (bandwidthResult && (bandwidthResult.code === 200 || bandwidthResult.code === 0 || bandwidthResult.devId)) {
        // 如果有code字段，取data；否则直接使用返回值
        const data = bandwidthResult.data || bandwidthResult;
        console.log('带宽收益数据:', data);
        setLinghanBandwidth(data);
      } else {
        console.warn('带宽收益数据为空');
        setLinghanBandwidth(null);
      }

      // 5. 获取拨号信息（仅大节点）
      if (devType === 1) {
        const dialingResult = await callLinghanAPI(`/getDialingInfo/${devId}`);
        console.log('拨号信息原始响应:', dialingResult);
        
        // getDialingInfo API直接返回数组，没有code包装
        if (dialingResult && (dialingResult.code === 200 || dialingResult.code === 0 || Array.isArray(dialingResult))) {
          // 如果有code字段，取data；如果是数组，直接使用
          const data = dialingResult.data || dialingResult;
          console.log('拨号信息数据:', data);
          setLinghanDialingInfo(data);
        } else {
          console.warn('拨号信息数据为空');
          setLinghanDialingInfo(null);
        }
      } else {
        console.log('设备类型为小节点，无拨号信息');
        setLinghanDialingInfo(null);
      }

    } catch (err) {
      console.error('加载设备详情失败:', err);
      // 设置默认值
      setLinghanTrafficData({ totalTraffic: 0, inTraffic: 0, outTraffic: 0 });
      setLinghanBandwidth(null);
      setLinghanDialingInfo(null);
    }

    setLinghanLoading(false);
  };
  // 批量导入灵瀚云设备
  const handleImportLinghanDevices = async () => {
    // 解析输入的设备ID
    const deviceIds = deviceIdsInput
      .split(/[\n,\s]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (deviceIds.length === 0) {
      alert('请输入至少一个设备ID');
      return;
    }

    const confirmed = confirm(
      `确定要导入以下 ${deviceIds.length} 个设备吗?\n\n` +
      deviceIds.slice(0, 5).join('\n') +
      (deviceIds.length > 5 ? `\n... 还有 ${deviceIds.length - 5} 个` : '')
    );

    if (!confirmed) {
      return;
    }

    setImporting(true);
    try {
      const response = await fetch('/api/admin/blockchain/import-linghan-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceIds })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ 导入成功！\n\n总计: ${result.data.total}\n成功: ${result.data.imported}\n跳过: ${result.data.skipped}`);
        setImportModalOpen(false);
        setDeviceIdsInput('');
        await loadData();
        if (activeTab === 'linghan') {
          await loadLinghanDevices();
        }
      } else {
        alert('❌ 导入失败: ' + result.error);
      }
    } catch (error: any) {
      alert('❌ 导入失败: ' + error.message);
    } finally {
      setImporting(false);
    }
  };;


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

  const deployLinghanDevice = async (machine: any) => {
    if (!deployForm.province || !deployForm.city || !deployForm.isp) {
      alert('请填写灵瀚云设备的省市和运营商信息');
      return;
    }

    setDeploying(true);
    try {
      const result = await callLinghanAPI('', 'POST', {
        devId: `lh-${machine.id}`,
        province: deployForm.province,
        city: deployForm.city,
        isp: deployForm.isp,
        upBandwidth: parseInt(deployForm.upBandwidth) || 100,
        lineNumber: parseInt(deployForm.lineNumber) || 1,
        devType: 2
      });

      if (result.code === 200 || result.code === 0) {
        // 同时在数据库中记录（调用区块链API）
        const dbResult = await fetch('/api/admin/blockchain/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskName: deployForm.nodeName,
            nodeType: 'linghan',
            nodeId: `lh-${machine.id}`,
            machineId: selectedMachine,
            walletAddress: '',
            serverIp: machine.ip_address,
          }),
        });

        alert('✅ 灵瀚云设备添加成功！');
        await loadData();
        resetForm();
      } else {
        alert('❌ 添加失败: ' + (result.message || result.msg || '未知错误'));
      }
    } catch (error: any) {
      alert('❌ 添加失败: ' + error.message);
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
      province: '',
      city: '',
      isp: '',
      upBandwidth: '',
      lineNumber: ''
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
    pendingTasks: pendingTasks.length, // 待分配任务数
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
            🌐 灵瀚云设备监控 {linghanDevices.length > 0 && `(${linghanDevices.length})`}
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

              {/* 新增：待分配任务卡片 */}
              <Card 
                className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30 cursor-pointer hover:border-red-400 transition-all"
                onClick={() => setShowPendingModal(true)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-2xl font-bold text-white">{stats.pendingTasks}</div>
                      <div className="text-sm text-gray-400">待分配任务</div>
                      <div className="text-xs text-red-400">点击查看</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 col-span-1 md:col-span-2">
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

            {/* 待分配任务弹窗 */}
            {showPendingModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
                <Card className="bg-gray-800 border-gray-700 max-w-4xl w-full max-h-[80vh] overflow-auto">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700 pb-4">
                    <CardTitle className="text-white">⏳ 待分配任务 ({pendingTasks.length})</CardTitle>
                    <button
                      onClick={() => {
                        setShowPendingModal(false);
                        setSelectedPendingTask(null);
                        setAssigningMachine(null);
                      }}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ✕
                    </button>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {pendingTasks.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">✅</div>
                        <div>暂无待分配任务</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              selectedPendingTask?.id === task.id
                                ? 'bg-blue-500/20 border-blue-500'
                                : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-bold text-white text-lg">{task.task_name}</div>
                                <div className="text-sm text-gray-400 mt-1">
                                  任务类型: <span className="text-blue-400">{NODE_TYPES.find(t => t.value === task.node_type)?.label}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  用户: {task.user_address} · 购买时间: {new Date(task.created_at).toLocaleString()}
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-red-500 text-white text-xs rounded">
                                待分配
                              </span>
                            </div>

                            {selectedPendingTask?.id === task.id && (
                              <div className="mt-4 pt-4 border-t border-gray-600">
                                <label className="text-white text-sm mb-2 block">选择分配的机器</label>
                                <select
                                  className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded mb-3"
                                  value={assigningMachine || ''}
                                  onChange={(e) => setAssigningMachine(Number(e.target.value))}
                                >
                                  <option value="">请选择机器</option>
                                  {machines.filter(m => m.status === 'active').map(m => (
                                    <option key={m.id} value={m.id}>
                                      {m.machine_name} ({m.ip_address}) - {m.cpu_cores}核 {m.memory_gb}GB
                                    </option>
                                  ))}
                                </select>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleAssignTask}
                                    disabled={!assigningMachine || deploying}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                  >
                                    {deploying ? '分配中...' : '确认分配'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPendingTask(null);
                                      setAssigningMachine(null);
                                    }}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            )}

                            {selectedPendingTask?.id !== task.id && (
                              <button
                                onClick={() => setSelectedPendingTask(task)}
                                className="w-full mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded transition-all"
                              >
                                分配此任务
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 三列布局 - 省略，与之前版本相同 */}
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

              {/* 中间和右侧部分保持与之前版本一致 - 省略以节省空间 */}
              
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
                                <>
                                  <div className="text-sm text-gray-400 mr-3">收益数据在监控面板查看</div>
                                  {/* 灵瀚云专属按钮 */}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setActiveTab('linghan')}
                                      className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded text-sm transition-all whitespace-nowrap"
                                    >
                                      📋 查看任务
                                    </button>
                                    <button
                                      onClick={() => setImportModalOpen(true)}
                                      disabled={importing}
                                      className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 rounded text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                      {importing ? '⏳ 导入中...' : '📥 批量导入'}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* 灵瀚云设备监控标签页 */}
        {activeTab === 'linghan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 左侧：设备列表 */}
            <div className="lg:col-span-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>灵瀚云设备列表</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImportModalOpen(true)}
                        disabled={importing}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {importing ? '⏳' : '📥'} 批量导入
                      </button>
                      <button
                        onClick={loadLinghanDevices}
                        className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                      >
                        🔄 刷新
                      </button>
                    </div>
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
                      <div className="text-sm text-gray-400 mb-4">还没有添加任何灵瀚云设备</div>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => setImportModalOpen(true)}
                          disabled={importing}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {importing ? '⏳ 导入中...' : '📥 批量导入现有设备'}
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('overview');
                            setDeployForm({...deployForm, nodeType: 'linghan'});
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all"
                        >
                          ➕ 手动添加新设备
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-3">
                        批量导入26个已绑定设备，或手动添加新设备
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {linghanDevices.map((device, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedLinghanDevice(device)}
                          className={`p-4 rounded-lg cursor-pointer transition-all border ${
                            selectedLinghanDevice?.devId === device.devId
                              ? 'bg-orange-500/30 border-orange-500'
                              : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-white">{device.devName || `设备-${device.devId}`}</div>
                              <div className="text-xs text-gray-400">{device.devId}</div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${
                              device.status === 1 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                            }`}>
                              {device.status === 1 ? '在线' : '离线'}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-300">
                            <div>📍 {device.province} {device.city}</div>
                            <div>🌐 {device.isp || '未知运营商'}</div>
                            <div>⚡ {device.upBandwidth || 0} Mbps</div>
                            {device.devType && (
                              <div className="text-orange-300">
                                类型: {device.devType === 1 ? '大节点' : '盒子'}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右侧：设备详情 */}
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
                <div className="space-y-6">
                  
                  {/* 设备基本信息 */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">📊 设备详情</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {linghanLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                        </div>
                      ) : linghanDeviceDetail ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">设备ID</div>
                            <div className="text-white font-medium">{linghanDeviceDetail.devId || selectedLinghanDevice.devId}</div>
                          </div>
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">设备名称</div>
                            <div className="text-white font-medium">
                              {linghanDeviceDetail.beizhu || linghanDeviceDetail.devName || selectedLinghanDevice?.beizhu || selectedLinghanDevice?.devName || '未命名'}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">位置</div>
                            <div className="text-white font-medium">{linghanDeviceDetail.province} {linghanDeviceDetail.city}</div>
                          </div>
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">运营商</div>
                            <div className="text-white font-medium">{linghanDeviceDetail.isp || '未知'}</div>
                          </div>
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">上行带宽</div>
                            <div className="text-white font-medium">{linghanDeviceDetail.upBandwidth || 0} Mbps</div>
                          </div>
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">状态</div>
                            <div className="text-white font-medium">
                              {linghanDeviceDetail.status === 1 ? '🟢 在线' : '🔴 离线'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">加载中...</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 网卡信息 */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">🌐 网卡信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {linghanNetworkCards.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">暂无网卡信息</div>
                      ) : (
                        <div className="space-y-3">
                          {linghanNetworkCards.map((card, index) => (
                            <div key={index} className="p-3 bg-gray-700/30 rounded border border-gray-600">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-white">{card.name}</div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    速率: {card.speed || 'N/A'} · IP: {card.ip || 'N/A'}
                                  </div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  (card.speed && card.speed !== '-1' && card.speed !== -1) || card.ip ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                                }`}>
                                  {(card.speed && card.speed !== '-1' && card.speed !== -1) || card.ip ? '活跃' : '未激活'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 流量监控 */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">📈 流量监控（今日）</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {linghanTrafficData ? (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded text-center">
                            <div className="text-2xl font-bold text-blue-400">
                              {(linghanTrafficData.totalTraffic / 1024).toFixed(2)} GB
                            </div>
                            <div className="text-xs text-gray-400 mt-1">总流量</div>
                          </div>
                          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded text-center">
                            <div className="text-2xl font-bold text-green-400">
                              {(linghanTrafficData.inTraffic / 1024).toFixed(2)} GB
                            </div>
                            <div className="text-xs text-gray-400 mt-1">入站流量</div>
                          </div>
                          <div className="p-4 bg-orange-500/20 border border-orange-500/30 rounded text-center">
                            <div className="text-2xl font-bold text-orange-400">
                              {(linghanTrafficData.outTraffic / 1024).toFixed(2)} GB
                            </div>
                            <div className="text-xs text-gray-400 mt-1">出站流量</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">暂无流量数据</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 95带宽收益 */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">💰 95带宽收益</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {linghanBandwidth ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">收益日期</div>
                            <div className="text-white font-medium">
                              {new Date(linghanBandwidth.incomeDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">最近结算收益</div>
                            <div className="text-2xl font-bold text-yellow-400">
                              ¥{linghanBandwidth.totalIncome?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">罚款</div>
                            <div className="text-2xl font-bold text-red-400">
                              ¥{linghanBandwidth.fine?.toFixed(2) || '0.00'}
                            </div>
                            {linghanBandwidth.fineReason && (
                              <div className="text-xs text-gray-400 mt-1">原因: {linghanBandwidth.fineReason}</div>
                            )}
                          </div>
                          <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">流量</div>
                            <div className="text-white font-medium">
                              {linghanBandwidth.flow || 0} GB
                            </div>
                          </div>
                          <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">状态</div>
                            <div className="text-white font-medium">
                              {linghanBandwidth.status === 1 ? '✅ 已结算' : '⏳ 待结算'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">暂无收益数据</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 拨号信息（仅大节点） */}
                  {selectedLinghanDevice.devType === 1 && (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">📞 拨号信息（大节点）</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {linghanDialingInfo && Array.isArray(linghanDialingInfo) ? (
                          <div className="space-y-4">
                            {/* 汇总统计 */}
                            <div className="grid grid-cols-4 gap-4">
                              <div className="p-3 bg-gray-700/30 rounded text-center">
                                <div className="text-2xl font-bold text-white">
                                  {linghanDialingInfo.reduce((sum, nic) => sum + (nic.lineCount || 0), 0)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">总线数</div>
                              </div>
                              <div className="p-3 bg-green-500/20 rounded text-center">
                                <div className="text-2xl font-bold text-green-400">
                                  {linghanDialingInfo.reduce((sum, nic) => sum + (nic.haveDialCount || 0), 0)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">已拨号</div>
                              </div>
                              <div className="p-3 bg-orange-500/20 rounded text-center">
                                <div className="text-2xl font-bold text-orange-400">
                                  {linghanDialingInfo.reduce((sum, nic) => sum + (nic.notDialCount || 0), 0)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">未拨号</div>
                              </div>
                              <div className="p-3 bg-blue-500/20 rounded text-center">
                                <div className="text-2xl font-bold text-blue-400">
                                  {linghanDialingInfo.reduce((sum, nic) => sum + (nic.connectCount || 0), 0)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">已连接</div>
                              </div>
                            </div>
                            
                            {/* 网卡详情 */}
                            <div className="space-y-2">
                              {linghanDialingInfo.map((nic, idx) => (
                                <div key={idx} className="p-3 bg-gray-700/30 rounded">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-white">{nic.name}</span>
                                    <span className="text-xs text-gray-400">
                                      {nic.speed > 0 ? `${nic.speed} Mbps` : '未连接'}
                                    </span>
                                  </div>
                                  {nic.lineList && nic.lineList.length > 0 && (
                                    <div className="space-y-1 text-sm">
                                      {nic.lineList.map((line, lineIdx) => (
                                        <div key={lineIdx} className="flex items-center gap-2 text-gray-300">
                                          <span className={line.dialStatus ? "text-green-400" : "text-red-400"}>
                                            {line.dialStatus ? "✓" : "✗"}
                                          </span>
                                          <span>IP: {line.ip || '无'}</span>
                                          {line.gateway && <span className="text-gray-500">网关: {line.gateway}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">暂无拨号信息</div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
