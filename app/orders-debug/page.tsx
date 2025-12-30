"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'

export default function OrdersDebugPage() {
  const [loading, setLoading] = useState(true)
  const [dbInfo, setDbInfo] = useState<any>(null)
  const [ordersInfo, setOrdersInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 获取数据库检查信息
      const dbResponse = await fetch('/api/admin/check-database', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      })
      const dbData = await dbResponse.json()
      
      if (dbData.success) {
        setDbInfo(dbData.data)
      }
      
      // 获取订单信息
      const ordersResponse = await api.getOrders()
      setOrdersInfo(ordersResponse)
      
    } catch (err: any) {
      console.error('Load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">错误: {error}</div>
          <a href="/login" className="text-blue-400">返回登录</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">数据库诊断</h1>
        
        {/* 表统计 */}
        {dbInfo?.table_counts && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">📊 表记录统计</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(dbInfo.table_counts).map(([table, count]: [string, any]) => (
                <div key={table} className="bg-slate-800 p-4 rounded">
                  <div className="text-slate-400 text-sm">{table}</div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* nodes 表数据 */}
        {dbInfo?.nodes && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              🗂️ nodes 表数据 ({dbInfo.nodes.count} 条记录)
            </h2>
            <pre className="bg-slate-800 p-4 rounded text-green-400 overflow-auto max-h-96 text-xs">
              {JSON.stringify(dbInfo.nodes.data, null, 2)}
            </pre>
          </div>
        )}
        
        {/* 订单 API 返回 */}
        {ordersInfo && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              📦 订单 API 返回 ({ordersInfo.orders?.length || 0} 条)
            </h2>
            <pre className="bg-slate-800 p-4 rounded text-cyan-400 overflow-auto max-h-96 text-xs">
              {JSON.stringify(ordersInfo, null, 2)}
            </pre>
          </div>
        )}
        
        {/* nodes 表结构 */}
        {dbInfo?.nodes_schema && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">🏗️ nodes 表结构</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-300">字段名</th>
                    <th className="px-4 py-2 text-left text-slate-300">数据类型</th>
                    <th className="px-4 py-2 text-left text-slate-300">可空</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {dbInfo.nodes_schema.map((col: any) => (
                    <tr key={col.column_name}>
                      <td className="px-4 py-2 text-blue-400 font-mono">{col.column_name}</td>
                      <td className="px-4 py-2 text-green-400">{col.data_type}</td>
                      <td className="px-4 py-2 text-slate-400">{col.is_nullable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* 所有表列表 */}
        {dbInfo?.tables && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">📋 所有数据表</h2>
            <div className="grid grid-cols-4 gap-2">
              {dbInfo.tables.map((table: string) => (
                <div key={table} className="bg-slate-800 px-3 py-2 rounded text-slate-300 text-sm font-mono">
                  {table}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 flex gap-4">
          <a href="/orders" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            返回订单页面
          </a>
          <button onClick={loadData} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg">
            刷新数据
          </button>
        </div>
      </div>
    </div>
  )
}
