'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, Activity, CheckCircle, XCircle, Clock, Terminal, RefreshCw, AlertCircle } from 'lucide-react';

export default function AgentManagementPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 并行请求所有数据
      const [machinesRes, tasksRes, statsRes] = await Promise.all([
        fetch('/api/agent/machines').catch(e => ({ ok: false, error: e.message })),
        fetch('/api/agent/tasks').catch(e => ({ ok: false, error: e.message })),
        fetch('/api/agent/stats').catch(e => ({ ok: false, error: e.message }))
      ]);

      // 处理机器数据
      if (machinesRes.ok) {
        const machinesData = await machinesRes.json();
        setMachines(Array.isArray(machinesData.machines) ? machinesData.machines : []);
      } else {
        setMachines([]);
      }

      // 处理任务数据
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : []);
      } else {
        setTasks([]);
      }

      // 处理统计数据
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setStats({
          total_machines: 0,
          online_machines: 0,
          total_tasks: 0,
          running_tasks: 0,
          successful_tasks: 0,
          success_rate: 0,
          avg_response_time: 0
        });
      }

    } catch (error: any) {
      console.error('加载数据失败:', error);
      setError(error.message || '无法连接到服务器');
      setMachines([]);
      setTasks([]);
      setStats({
        total_machines: 0,
        online_machines: 0,
        total_tasks: 0,
        running_tasks: 0,
        successful_tasks: 0,
        success_rate: 0,
        avg_response_time: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // 每30秒自动刷新
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 发送远程命令
  const executeCommand = async (machineCode: string) => {
    if (!commandInput.trim()) {
      alert('请输入命令');
      return;
    }

    try {
      const response = await fetch('/api/agent/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_code: machineCode,
          command: commandInput
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`命令已发送: ${result.task_id}`);
        setCommandInput('');
        loadData();
      } else {
        alert(`命令发送失败: ${result.error || '未知错误'}`);
      }
    } catch (error: any) {
      alert(`命令发送失败: ${error.message}`);
    }
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      online: { label: '在线', variant: 'default', color: 'bg-green-500' },
      offline: { label: '离线', variant: 'destructive', color: 'bg-red-500' },
      pending: { label: '待处理', variant: 'secondary', color: 'bg-yellow-500' },
      running: { label: '运行中', variant: 'default', color: 'bg-blue-500' },
      completed: { label: '已完成', variant: 'default', color: 'bg-green-500' },
      failed: { label: '失败', variant: 'destructive', color: 'bg-red-500' }
    };

    const config = statusConfig[status] || statusConfig.offline;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
        {config.label}
      </Badge>
    );
  };

  if (loading && machines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">正在加载 Agent 数据...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent 管理系统</h1>
          <p className="text-muted-foreground">统一管理所有节点机器和任务</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总机器数</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_machines || 0}</div>
            <p className="text-xs text-muted-foreground">
              在线: {stats?.online_machines || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_tasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              运行中: {stats?.running_tasks || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.success_rate ? `${(stats.success_rate * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              成功: {stats?.successful_tasks || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均响应</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avg_response_time ? `${stats.avg_response_time.toFixed(1)}s` : '0s'}
            </div>
            <p className="text-xs text-muted-foreground">系统响应时间</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="machines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="machines">
            机器列表 ({machines.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            任务管理 ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="command">远程控制</TabsTrigger>
        </TabsList>

        {/* 机器列表 */}
        <TabsContent value="machines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>注册机器列表</CardTitle>
              <CardDescription>查看和管理所有已注册的节点机器</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {machines.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无机器注册</p>
                    <p className="text-sm mt-1">等待 Agent 客户端连接...</p>
                  </div>
                ) : (
                  machines.map((machine: any) => (
                    <div
                      key={machine.machine_code}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedMachine(machine)}
                    >
                      <div className="flex items-center gap-4">
                        <Server className="w-8 h-8 text-primary" />
                        <div>
                          <div className="font-medium">{machine.machine_code}</div>
                          <div className="text-sm text-muted-foreground">
                            {machine.hostname} • {machine.ip_address}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(machine.status)}
                        <div className="text-sm text-muted-foreground">
                          {machine.last_seen && new Date(machine.last_seen).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 任务管理 */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>任务列表</CardTitle>
              <CardDescription>查看所有任务执行状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无任务</p>
                  </div>
                ) : (
                  tasks.map((task: any) => (
                    <div
                      key={task.task_id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{task.task_id}</div>
                        <div className="text-sm text-muted-foreground">
                          机器: {task.machine_code}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(task.status)}
                        <div className="text-sm text-muted-foreground">
                          {task.created_at && new Date(task.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 远程控制 */}
        <TabsContent value="command" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>远程命令执行</CardTitle>
              <CardDescription>向指定机器发送远程命令</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {machines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>没有可用的机器</p>
                  <p className="text-sm mt-1">请先等待机器上线</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">选择机器</label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      onChange={(e) => {
                        const machine = machines.find((m: any) => m.machine_code === e.target.value);
                        setSelectedMachine(machine);
                      }}
                      value={selectedMachine?.machine_code || ''}
                    >
                      <option value="">请选择机器</option>
                      {machines.map((machine: any) => (
                        <option key={machine.machine_code} value={machine.machine_code}>
                          {machine.hostname} ({machine.machine_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">命令</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入要执行的命令..."
                        value={commandInput}
                        onChange={(e) => setCommandInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && selectedMachine) {
                            executeCommand(selectedMachine.machine_code);
                          }
                        }}
                      />
                      <Button
                        onClick={() => selectedMachine && executeCommand(selectedMachine.machine_code)}
                        disabled={!selectedMachine || !commandInput.trim()}
                      >
                        <Terminal className="w-4 h-4 mr-2" />
                        执行
                      </Button>
                    </div>
                  </div>

                  {selectedMachine && (
                    <div className="p-4 bg-muted rounded-md">
                      <div className="text-sm font-medium mb-2">当前选择:</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>机器码: {selectedMachine.machine_code}</div>
                        <div>主机名: {selectedMachine.hostname}</div>
                        <div>IP: {selectedMachine.ip_address}</div>
                        <div className="flex items-center gap-2">
                          状态: {getStatusBadge(selectedMachine.status)}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
