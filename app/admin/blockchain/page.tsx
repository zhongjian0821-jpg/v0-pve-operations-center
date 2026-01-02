'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Server, 
  Activity, 
  DollarSign, 
  Zap,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  TrendingUp
} from 'lucide-react'

export default function BlockchainManagement() {
  const [machines, setMachines] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [deployForm, setDeployForm] = useState({
    taskType: '',
    taskName: '',
    nodeId: '',
    walletAddress: ''
  })

  // 节点类型配置
  const nodeTypes = [
    { value: 'cosmos', label: 'Cosmos Hub 验证节点', hourlyEarning: 0.22, dailyEarning: 5.20 },
    { value: 'polygon', label: 'Polygon 验证节点', hourlyEarning: 0.35, dailyEarning: 8.50 },
    { value: 'near', label: 'NEAR 验证节点', hourlyEarning: 0.26, dailyEarning: 6.30 },
    { value: 'sui', label: 'Sui 验证节点', hourlyEarning: 0.53, dailyEarning: 12.80 }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // 加载机器列表
    const machinesRes = await fetch('/api/admin/blockchain/machines')
    const machinesData = await machinesRes.json()
    if (machinesData.success) {
      setMachines(machinesData.data)
    }

    // 加载任务列表
    const tasksRes = await fetch('/api/admin/blockchain/nodes')
    const tasksData = await tasksRes.json()
    if (tasksData.success) {
      setTasks(tasksData.data)
    }
  }

  // 区分待部署和已部署机器
  const pendingMachines = machines.filter(m => 
    m.status === 'active' && tasks.filter(t => t.machine_id === m.id).length === 0
  )
  const deployedMachines = machines.filter(m => 
    tasks.filter(t => t.machine_id === m.id).length > 0
  )

  // 按任务类型分组统计
  const taskStats = nodeTypes.map(type => {
    const typeTasks = tasks.filter(t => t.node_type === type.value)
    const runningCount = typeTasks.filter(t => t.status === 'running').length
    const totalEarnings = runningCount * type.hourlyEarning

    return {
      type: type.value,
      label: type.label,
      totalMachines: typeTasks.length,
      runningMachines: runningCount,
      stoppedMachines: typeTasks.filter(t => t.status === 'stopped').length,
      failedMachines: typeTasks.filter(t => t.status === 'failed').length,
      hourlyEarning: totalEarnings.toFixed(2),
      dailyEarning: (totalEarnings * 24).toFixed(2)
    }
  })

  const totalStats = {
    totalMachines: machines.length,
    availableMachines: machines.filter(m => m.status === 'active').length,
    pendingMachines: pendingMachines.length,
    totalTasks: tasks.length,
    runningTasks: tasks.filter(t => t.status === 'running').length,
    totalHourlyEarning: taskStats.reduce((sum, s) => sum + parseFloat(s.hourlyEarning), 0).toFixed(2),
    totalDailyEarning: taskStats.reduce((sum, s) => sum + parseFloat(s.dailyEarning), 0).toFixed(2)
  }

  const handleDeploy = async () => {
    if (!selectedMachine || !deployForm.taskType) {
      alert('请选择机器和任务类型')
      return
    }

    const machine = machines.find(m => m.id === selectedMachine)
    
    const payload = {
      taskName: deployForm.taskName,
      nodeType: deployForm.taskType,
      nodeId: deployForm.nodeId,
      machineId: selectedMachine,
      walletAddress: deployForm.walletAddress,
      serverIp: machine.ip_address,
      sshPort: machine.ssh_port,
      sshUser: machine.ssh_user,
      sshPassword: machine.ssh_password
    }

    try {
      const response = await fetch('/api/admin/blockchain/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      
      if (result.success) {
        alert('✅ 任务部署成功！')
        loadData()
        setDeployForm({ taskType: '', taskName: '', nodeId: '', walletAddress: '' })
        setSelectedMachine(null)
      } else {
        alert('❌ 部署失败: ' + result.error)
      }
    } catch (error) {
      alert('❌ 部署失败: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">区块链任务管理中心</h1>
            <p className="text-gray-400">管理机器 · 部署任务 · 监控收益</p>
          </div>
        </div>

        {/* 总体统计 */}
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30 p-4">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{totalStats.totalMachines}</div>
                <div className="text-sm text-gray-400">总机器数</div>
                <div className="text-xs text-green-400">{totalStats.availableMachines} 可用</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-white">{totalStats.pendingMachines}</div>
                <div className="text-sm text-gray-400">待部署</div>
                <div className="text-xs text-orange-400">⚠️ 需要部署</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">{nodeTypes.length}</div>
                <div className="text-sm text-gray-400">任务包类型</div>
                <div className="text-xs text-purple-400">{taskStats.filter(s => s.totalMachines > 0).length} 激活中</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{totalStats.runningTasks}</div>
                <div className="text-sm text-gray-400">运行中任务</div>
                <div className="text-xs text-green-400">共{totalStats.totalTasks}个</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">${totalStats.totalHourlyEarning}</div>
                <div className="text-sm text-gray-400">每小时收益</div>
                <div className="text-xs text-yellow-400">实时</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-cyan-400" />
              <div>
                <div className="text-2xl font-bold text-white">${totalStats.totalDailyEarning}</div>
                <div className="text-sm text-gray-400">每日收益</div>
                <div className="text-xs text-cyan-400">预计</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 border-pink-500/30 p-4 col-span-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-pink-400" />
              <div className="flex-1">
                <div className="text-2xl font-bold text-white">
                  ${(parseFloat(totalStats.totalDailyEarning) * 30).toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">月度收益预计</div>
                <div className="text-xs text-pink-400">基于当前所有任务包</div>
              </div>
            </div>
          </Card>
        </div>

        {/* 主要内容区域 - 三列布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左侧：机器列表（分待部署和已部署） */}
          <div className="lg:col-span-4">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Server className="w-5 h-5" />
                机器管理
              </h2>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {/* 待部署机器区域 */}
                {pendingMachines.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-sm font-bold text-orange-400 flex items-center gap-1">
                        ⚠️ 待部署机器 ({pendingMachines.length})
                      </div>
                      <div className="flex-1 h-px bg-orange-500/30"></div>
                    </div>
                    
                    <div className="space-y-2">
                      {pendingMachines.map(machine => (
                        <Card 
                          key={machine.id}
                          className={`p-4 cursor-pointer transition-all border-2 ${
                            selectedMachine === machine.id
                              ? 'bg-orange-500/30 border-orange-500 shadow-lg shadow-orange-500/50'
                              : 'bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20 animate-pulse'
                          }`}
                          onClick={() => setSelectedMachine(machine.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                {machine.machine_name}
                                <Badge className="bg-orange-500 animate-pulse">
                                  ⚠️ 待部署
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-400">{machine.ip_address}</div>
                            </div>
                            <Badge className="bg-green-500">
                              {machine.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div className="flex items-center gap-1 text-gray-300">
                              <Cpu className="w-3 h-3" />
                              {machine.cpu_cores} 核
                            </div>
                            <div className="flex items-center gap-1 text-gray-300">
                              <HardDrive className="w-3 h-3" />
                              {machine.memory_gb} GB
                            </div>
                            <div className="flex items-center gap-1 text-gray-300">
                              <HardDrive className="w-3 h-3" />
                              {machine.storage_gb} GB
                            </div>
                            <div className="flex items-center gap-1 text-gray-300">
                              <Wifi className="w-3 h-3" />
                              {machine.bandwidth || '100M'}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-orange-500/30">
                            <div className="text-xs text-orange-400 font-medium">
                              💰 空闲机器，立即部署开始赚钱！
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 已部署机器区域 */}
                {deployedMachines.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-sm font-bold text-green-400 flex items-center gap-1">
                        ✅ 已部署机器 ({deployedMachines.length})
                      </div>
                      <div className="flex-1 h-px bg-green-500/30"></div>
                    </div>
                    
                    <div className="space-y-2">
                      {deployedMachines.map(machine => (
                        <Card 
                          key={machine.id}
                          className={`p-4 cursor-pointer transition-all ${
                            selectedMachine === machine.id
                              ? 'bg-blue-500/30 border-blue-500'
                              : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                          }`}
                          onClick={() => setSelectedMachine(machine.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-bold text-white">{machine.machine_name}</div>
                              <div className="text-sm text-gray-400">{machine.ip_address}</div>
                            </div>
                            <Badge className={
                              machine.status === 'active' 
                                ? 'bg-green-500' 
                                : 'bg-gray-500'
                            }>
                              {machine.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-gray-300">
                              <Cpu className="w-3 h-3" />
                              {machine.cpu_cores} 核
                            </div>
                            <div className="flex items-center gap-1 text-gray-300">
                              <HardDrive className="w-3 h-3" />
                              {machine.memory_gb} GB
                            </div>
                            <div className="flex items-center gap-1 text-gray-300">
                              <HardDrive className="w-3 h-3" />
                              {machine.storage_gb} GB
                            </div>
                            <div className="flex items-center gap-1 text-gray-300">
                              <Wifi className="w-3 h-3" />
                              {machine.bandwidth || '100M'}
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-gray-600">
                            <div className="text-xs text-gray-400">
                              运行任务: <span className="text-green-400 font-medium">
                                {tasks.filter(t => t.machine_id === machine.id).length} 个
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 空状态 */}
                {machines.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    暂无机器
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* 中间：任务包总览 */}
          <div className="lg:col-span-5">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                任务包管理 - 按类型统计
              </h2>

              <div className="space-y-4">
                {taskStats.map(stat => (
                  <Card key={stat.type} className="bg-gradient-to-r from-gray-700/40 to-gray-700/20 border-gray-600 p-5 hover:border-blue-500/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-bold text-white text-xl">{stat.label}</div>
                          <Badge className={
                            stat.totalMachines > 0 
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-lg px-3 py-1" 
                              : "bg-gray-600 text-lg px-3 py-1"
                          }>
                            {stat.totalMachines} 台机器
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 font-medium">{stat.runningMachines} 运行中</span>
                          </div>
                          {stat.stoppedMachines > 0 && (
                            <div className="flex items-center gap-1">
                              <PauseCircle className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-400 font-medium">{stat.stoppedMachines} 已停止</span>
                            </div>
                          )}
                          {stat.failedMachines > 0 && (
                            <div className="flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-red-400 font-medium">{stat.failedMachines} 失败</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-400 mb-1">
                          ${stat.hourlyEarning}
                          <span className="text-sm text-gray-400 ml-1">/时</span>
                        </div>
                        <div className="text-lg text-gray-300">
                          ${stat.dailyEarning}
                          <span className="text-xs text-gray-400 ml-1">/天</span>
                        </div>
                      </div>
                    </div>

                    {/* 进度条显示运行状态 */}
                    {stat.totalMachines > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>任务运行状态</span>
                          <span>{stat.runningMachines}/{stat.totalMachines} 运行中</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all"
                            style={{ width: `${(stat.runningMachines / stat.totalMachines) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 如果没有机器，显示提示 */}
                    {stat.totalMachines === 0 && (
                      <div className="mt-2 text-sm text-gray-500 italic">
                        暂无机器运行此任务类型
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* 所有任务详细列表 */}
              <h3 className="text-lg font-bold text-white mt-6 mb-3">所有运行任务</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {tasks.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    暂无任务
                  </div>
                ) : (
                  tasks.map(task => (
                    <Card key={task.id} className="bg-gray-700/30 border-gray-600 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{task.task_name}</div>
                          <div className="text-xs text-gray-400">
                            {nodeTypes.find(nt => nt.value === task.node_type)?.label}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            task.status === 'running' ? 'bg-green-500' :
                            task.status === 'stopped' ? 'bg-yellow-500' : 'bg-red-500'
                          }>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* 右侧：部署新任务 */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800/50 border-gray-700 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                部署新任务
              </h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2">选择机器</Label>
                  <Select 
                    value={selectedMachine?.toString()} 
                    onValueChange={(val) => setSelectedMachine(parseInt(val))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="选择要部署的机器" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.machine_name} ({m.ip_address})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white mb-2">任务类型</Label>
                  <Select 
                    value={deployForm.taskType}
                    onValueChange={(val) => setDeployForm({...deployForm, taskType: val})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="选择任务类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodeTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} (${type.hourlyEarning}/时)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white mb-2">任务名称</Label>
                  <Input
                    placeholder="例如: validator-1"
                    className="bg-gray-700 border-gray-600 text-white"
                    value={deployForm.taskName}
                    onChange={(e) => setDeployForm({...deployForm, taskName: e.target.value})}
                  />
                </div>

                <div>
                  <Label className="text-white mb-2">Node ID</Label>
                  <Input
                    placeholder="例如: node-001"
                    className="bg-gray-700 border-gray-600 text-white"
                    value={deployForm.nodeId}
                    onChange={(e) => setDeployForm({...deployForm, nodeId: e.target.value})}
                  />
                </div>

                <div>
                  <Label className="text-white mb-2">钱包地址</Label>
                  <Input
                    placeholder="例如: cosmos1abc..."
                    className="bg-gray-700 border-gray-600 text-white"
                    value={deployForm.walletAddress}
                    onChange={(e) => setDeployForm({...deployForm, walletAddress: e.target.value})}
                  />
                </div>

                <Button 
                  onClick={handleDeploy}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  disabled={!selectedMachine || !deployForm.taskType}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  立即部署任务
                </Button>

                {/* 预计收益提示 */}
                {deployForm.taskType && (
                  <Card className="bg-green-500/20 border-green-500/30 p-3">
                    <div className="text-sm text-white">
                      <div className="font-bold mb-1">预计收益</div>
                      <div className="text-xs text-green-300">
                        每小时: ${nodeTypes.find(t => t.value === deployForm.taskType)?.hourlyEarning}
                      </div>
                      <div className="text-xs text-green-300">
                        每天: ${nodeTypes.find(t => t.value === deployForm.taskType)?.dailyEarning}
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
  )
}
