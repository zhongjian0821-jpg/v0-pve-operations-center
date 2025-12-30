"use client"

import { useEffect, useState } from 'react'

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    
    // 简单测试：直接调用 API
    fetch('/api/orders', {
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log('API Response:', data)
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('API Error:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (!mounted) {
    return null
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
        <h1 className="text-4xl font-bold text-white mb-8">订单管理 - 测试版本</h1>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">API 响应数据</h2>
          
          <pre className="bg-slate-800 p-4 rounded text-green-400 overflow-auto max-h-96 text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
          
          {data?.success && data?.data ? (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-white mb-3">统计信息</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-900/30 p-4 rounded">
                  <div className="text-blue-400 text-sm">总订单</div>
                  <div className="text-3xl font-bold text-white">{data.data.stats?.total || 0}</div>
                </div>
                <div className="bg-green-900/30 p-4 rounded">
                  <div className="text-green-400 text-sm">已激活</div>
                  <div className="text-3xl font-bold text-white">{data.data.stats?.active || 0}</div>
                </div>
                <div className="bg-purple-900/30 p-4 rounded">
                  <div className="text-purple-400 text-sm">云节点</div>
                  <div className="text-3xl font-bold text-white">{data.data.stats?.cloud_nodes || 0}</div>
                </div>
                <div className="bg-orange-900/30 p-4 rounded">
                  <div className="text-orange-400 text-sm">镜像节点</div>
                  <div className="text-3xl font-bold text-white">{data.data.stats?.image_nodes || 0}</div>
                </div>
              </div>
              
              {data.data.orders?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-white mb-3">订单列表</h3>
                  <div className="text-white">共 {data.data.orders.length} 条订单</div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 text-center">
              <div className="text-yellow-400 text-lg">
                {data?.success === false ? `API 错误: ${data?.error}` : '无数据'}
              </div>
              {data?.error?.includes('Unauthorized') && (
                <a href="/login" className="text-blue-400 hover:underline mt-4 inline-block">
                  请先登录
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
