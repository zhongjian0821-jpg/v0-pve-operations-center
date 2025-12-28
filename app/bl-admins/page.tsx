'use client';
import { useState } from 'react';
export default function BlockchainAdminsPage() {
  const [info] = useState({
    system: '区块链节点托管系统',
    version: 'v2.0',
    backend: 'PVE Operations Center',
    database: 'PostgreSQL (Vercel)',
    tables: 5,
    apis: 5
  });
  return (
    <div className="p-8">
      <div className="mb-6"><h1 className="text-3xl font-bold">区块链托管 - 系统信息</h1><p className="text-gray-600 mt-2">管理员和系统配置</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">系统信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">系统名称:</span><span className="font-medium">{info.system}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">版本:</span><span className="font-medium">{info.version}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">后端:</span><span className="font-medium">{info.backend}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">数据库:</span><span className="font-medium">{info.database}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">表数量:</span><span className="font-medium">{info.tables} 个</span></div>
            <div className="flex justify-between py-2"><span className="text-gray-600">API数量:</span><span className="font-medium">{info.apis} 个</span></div>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">数据表列表</h2>
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 rounded flex items-center"><span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3">1</span><span className="font-medium">bl_admins - 管理员</span></div>
            <div className="p-3 bg-green-50 rounded flex items-center"><span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-3">2</span><span className="font-medium">bl_customers - 客户</span></div>
            <div className="p-3 bg-purple-50 rounded flex items-center"><span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm mr-3">3</span><span className="font-medium">bl_machines - 机器</span></div>
            <div className="p-3 bg-yellow-50 rounded flex items-center"><span className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm mr-3">4</span><span className="font-medium">bl_blockchain_nodes - 节点</span></div>
            <div className="p-3 bg-red-50 rounded flex items-center"><span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm mr-3">5</span><span className="font-medium">bl_earnings - 收益</span></div>
          </div>
        </div>
      </div>
      <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">🎉 迁移完成！</h2>
        <p className="text-blue-100">区块链托管系统已成功集成到PVE Operations Center，所有数据和API统一管理。</p>
      </div>
    </div>
  );
}
