// app/admin/data-migration/page.tsx
// Web3数据迁移管理界面

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TableStatus {
  table: string;
  web3_rows: number;
  pve_rows: number;
  needs_migration: boolean;
  difference: number;
  error?: string;
}

export default function DataMigrationPage() {
  const [status, setStatus] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/migrate-web3-data?action=status');
      const data = await res.json();
      
      if (data.success) {
        setStatus(data.status);
        addLog('✅ 数据状态加载成功');
      } else {
        addLog(`❌ 加载失败: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ 请求失败: ${error}`);
    }
    setLoading(false);
  }

  async function migrateTable(table: string, mode: string = 'merge') {
    setMigrating(table);
    addLog(`🔄 开始迁移表: ${table} (模式: ${mode})`);

    try {
      const res = await fetch('/api/admin/migrate-web3-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, mode }),
      });

      const data = await res.json();

      if (data.success) {
        addLog(`✅ ${table} 迁移成功: ${data.migrated} 条记录`);
        if (data.errors > 0) {
          addLog(`⚠️  ${table} 有 ${data.errors} 条记录迁移失败`);
        }
        // 重新加载状态
        await loadStatus();
      } else {
        addLog(`❌ ${table} 迁移失败: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ ${table} 迁移请求失败: ${error}`);
    }

    setMigrating(null);
  }

  async function migrateAll() {
    const tablesToMigrate = status.filter(s => s.needs_migration);
    
    addLog(`🚀 开始批量迁移 ${tablesToMigrate.length} 个表`);

    for (const tableStatus of tablesToMigrate) {
      await migrateTable(tableStatus.table, 'merge');
    }

    addLog('🎉 批量迁移完成！');
  }

  function addLog(message: string) {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }

  const summary = {
    total: status.length,
    withData: status.filter(s => s.web3_rows > 0).length,
    needsMigration: status.filter(s => s.needs_migration).length,
    totalWeb3Rows: status.reduce((sum, s) => sum + s.web3_rows, 0),
    totalPveRows: status.reduce((sum, s) => sum + s.pve_rows, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Web3数据迁移管理</h1>
          <p className="text-gray-600 mt-2">
            从Web3会员中心迁移数据到PVE管理系统
          </p>
        </div>

        {/* 总览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">总表数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Web3总数据</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {summary.totalWeb3Rows.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">行</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">PVE已有数据</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {summary.totalPveRows.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">行</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">需要迁移</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {summary.needsMigration}
              </div>
              <div className="text-sm text-gray-500">个表</div>
            </CardContent>
          </Card>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={loadStatus}
            disabled={loading}
            variant="outline"
          >
            {loading ? '加载中...' : '🔄 刷新状态'}
          </Button>

          <Button
            onClick={migrateAll}
            disabled={migrating !== null || summary.needsMigration === 0}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {migrating ? '迁移中...' : '🚀 批量迁移'}
          </Button>
        </div>

        {/* 表格列表 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>数据表状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">表名</th>
                    <th className="text-right p-4">Web3数据</th>
                    <th className="text-right p-4">PVE数据</th>
                    <th className="text-right p-4">差异</th>
                    <th className="text-center p-4">状态</th>
                    <th className="text-center p-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {status.map((item) => (
                    <tr key={item.table} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-mono">{item.table}</td>
                      <td className="p-4 text-right">
                        {item.web3_rows.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        {item.pve_rows.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <span className={
                          item.difference > 0 ? 'text-orange-600 font-semibold' : 'text-gray-400'
                        }>
                          {item.difference > 0 ? `+${item.difference}` : item.difference}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {item.error ? (
                          <span className="text-red-600">❌ 错误</span>
                        ) : item.needs_migration ? (
                          <span className="text-orange-600">⚠️ 需要迁移</span>
                        ) : item.web3_rows === 0 ? (
                          <span className="text-gray-400">- 无数据</span>
                        ) : (
                          <span className="text-green-600">✅ 已同步</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {item.web3_rows > 0 && (
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={() => migrateTable(item.table, 'merge')}
                              disabled={migrating !== null}
                              variant="outline"
                            >
                              {migrating === item.table ? '迁移中...' : '合并'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => migrateTable(item.table, 'replace')}
                              disabled={migrating !== null}
                              variant="outline"
                              className="text-red-600"
                            >
                              替换
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 日志面板 */}
        <Card>
          <CardHeader>
            <CardTitle>迁移日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">等待操作...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
