'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Withdrawal {
  id: number
  wallet_address: string
  amount: string
  amount_usd: string
  burn_rate: string
  burn_amount: string
  actual_amount: string
  status: string
  tx_hash: string | null
  reject_reason: string | null
  created_at: string
  processed_at: string | null
}

interface Stats {
  total_count: string
  total_amount: string
  total_actual_amount: string
  pending_count: string
  completed_count: string
  rejected_count: string
  processing_count: string
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogType, setDialogType] = useState<'approve' | 'reject'>('approve')
  const [txHash, setTxHash] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchWithdrawals()
  }, [statusFilter])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      
      let url = '/api/withdrawals?'
      if (statusFilter !== 'all') {
        url += `status=${statusFilter}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setWithdrawals(data.data.records)
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error('获取提现记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedId) return

    try {
      const body: any = {
        id: selectedId,
        status: dialogType === 'approve' ? 'completed' : 'rejected'
      }

      if (dialogType === 'approve' && txHash) {
        body.tx_hash = txHash
      }

      if (dialogType === 'reject' && rejectReason) {
        body.reject_reason = rejectReason
      }

      const response = await fetch('/api/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        setShowDialog(false)
        setSelectedId(null)
        setTxHash('')
        setRejectReason('')
        fetchWithdrawals()
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return styles[status] || styles.pending
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      rejected: '已拒绝'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载提现记录...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-3xl font-bold">提现管理</h1>
        <p className="text-gray-600 mt-2">管理用户提现申请和记录</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">总提现次数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_count}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-yellow-700">⏳ 待处理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">{stats.pending_count}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-green-700">✅ 已完成</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{stats.completed_count}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-blue-700">💰 总提现金额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {parseFloat(stats.total_actual_amount).toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">ASHVA</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>状态筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              全部
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              待处理
            </Button>
            <Button
              variant={statusFilter === 'processing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('processing')}
            >
              处理中
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              已完成
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('rejected')}
            >
              已拒绝
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 提现列表 */}
      <div className="space-y-4">
        {withdrawals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">暂无提现记录</p>
            </CardContent>
          </Card>
        ) : (
          withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">提现 #{withdrawal.id}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {withdrawal.wallet_address.slice(0, 10)}...{withdrawal.wallet_address.slice(-8)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(withdrawal.status)}`}>
                    {getStatusLabel(withdrawal.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">申请金额</p>
                    <p className="text-lg font-semibold">
                      {parseFloat(withdrawal.amount).toLocaleString()} ASHVA
                    </p>
                    <p className="text-xs text-gray-500">
                      ≈ ${parseFloat(withdrawal.amount_usd).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">🔥 燃烧金额</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {parseFloat(withdrawal.burn_amount).toLocaleString()} ASHVA
                    </p>
                    <p className="text-xs text-gray-500">
                      {(parseFloat(withdrawal.burn_rate) * 100).toFixed(1)}% 燃烧率
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">实际到账</p>
                    <p className="text-lg font-semibold text-green-600">
                      {parseFloat(withdrawal.actual_amount).toLocaleString()} ASHVA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">创建时间</p>
                    <p className="text-sm font-medium">
                      {new Date(withdrawal.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                
                {withdrawal.tx_hash && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">交易哈希</p>
                    <p className="text-sm font-mono">{withdrawal.tx_hash}</p>
                  </div>
                )}
                
                {withdrawal.reject_reason && (
                  <div className="mb-3">
                    <p className="text-sm text-red-600">拒绝原因</p>
                    <p className="text-sm">{withdrawal.reject_reason}</p>
                  </div>
                )}
                
                {withdrawal.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedId(withdrawal.id)
                        setDialogType('approve')
                        setShowDialog(true)
                      }}
                    >
                      ✅ 批准
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedId(withdrawal.id)
                        setDialogType('reject')
                        setShowDialog(true)
                      }}
                    >
                      ❌ 拒绝
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 简单对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {dialogType === 'approve' ? '批准提现' : '拒绝提现'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dialogType === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">交易哈希</label>
                    <Input
                      placeholder="0x..."
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                    />
                  </div>
                )}
                
                {dialogType === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">拒绝原因</label>
                    <Input
                      placeholder="请输入拒绝原因"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDialog(false)
                      setTxHash('')
                      setRejectReason('')
                    }}
                  >
                    取消
                  </Button>
                  <Button onClick={handleAction}>
                    确认
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
