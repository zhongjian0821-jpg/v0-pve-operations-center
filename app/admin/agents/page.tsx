'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, Activity, CheckCircle, XCircle, Clock, Terminal, RefreshCw } from 'lucide-react';

export default function AgentManagementPage() {
  const [machines, setMachines] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commandInput, setCommandInput] = useState('');
  const [selectedMachine, setSelectedMachine] = useState(null);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 并行请求所有数据
      const [machinesRes, tasksRes, statsRes] = await Promise.all([
        fetch('/api/agent/machines'),
        fetch('/api/agent/tasks'),
        fetch('/api/agent/stats')
      ]);

      const [machinesData, tasksData, statsData] = await Promise.all([
        machinesRes.json(),
        tasksRes.json(),
        statsRes.json()
      ]);

      setMachines(machinesData.machines || []);
      setTasks(tasksData.tasks || []);
      setStats(statsData);
    } catch (error) {
      console.error('加载数据失败:', error);
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
    if (!commandInput.trim()) return;

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
      alert(`命令已发送: ${result.task_id}`);
      setCommandInput('');
      loadData();
    } catch (error) {
      alert('命令发送失败');
    }
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const statusMap = {
      online: { label: '在线', variant: 'default', icon: CheckCircle },
      offline: { label: '离线', variant: 'destructive', icon: XCircle },
      pending: { label: '待处理', variant: 'secondary', icon: Clock },
      running: { label: '运行中', variant: 'default', icon: Activity }
    };

    const config = statusMap[status] || statusMap.offline;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
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
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新数据
        </Button>
      </div>

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
          <TabsTrigger value="machines">机器列表</TabsTrigger>
          <TabsTrigger value="tasks">任务管理</TabsTrigger>
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
                    暂无机器注册
                  </div>
                ) : (
                  machines.map((machine: any) => (
                    <div
                      key={machine.machine_code}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
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
                          {new Date(machine.last_seen).toLocaleString('zh-CN')}
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
                    暂无任务
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
                          {new Date(task.created_at).toLocaleString('zh-CN')}
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
              <div className="space-y-2">
                <label className="text-sm font-medium">选择机器</label>
                <select
                  className="w-full p-2 border rounded-md"
                  onChange={(e) => setSelectedMachine(machines.find((m: any) => m.machine_code === e.target.value))}
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
                    <div>状态: {getStatusBadge(selectedMachine.status)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
