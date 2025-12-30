'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  DollarSign,
  Flame,
  ExternalLink
} from 'lucide-react'

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
  member_level: string
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
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [actionDialog, setActionDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
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
    if (!selectedWithdrawal || !actionType) return

    try {
      const body: any = {
        id: selectedWithdrawal.id,
        status: actionType === 'approve' ? 'completed' : 'rejected'
      }

      if (actionType === 'approve' && txHash) {
        body.tx_hash = txHash
      }

      if (actionType === 'reject' && rejectReason) {
        body.reject_reason = rejectReason
      }

      const response = await fetch('/api/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        setActionDialog(false)
        setSelectedWithdrawal(null)
        setTxHash('')
        setRejectReason('')
        fetchWithdrawals()
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { 
        label: '待处理', 
        variant: 'secondary',
        icon: <Clock className="w-3 h-3" />
      },
      processing: { 
        label: '处理中', 
        variant: 'default',
        icon: <AlertCircle className="w-3 h-3" />
      },
      completed: { 
        label: '已完成', 
        variant: 'default',
        icon: <CheckCircle className="w-3 h-3" />
      },
      rejected: { 
        label: '已拒绝', 
        variant: 'destructive',
        icon: <XCircle className="w-3 h-3" />
      }
    }
    
    const config = configs[status] || configs.pending
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">总提现次数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_count}</div>
            </CardContent>
          </Card>
          
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                待处理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">{stats.pending_count}</div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                已完成
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{stats.completed_count}</div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700">总提现金额</CardTitle>
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
          <div className="flex gap-2">
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
            <Card key={withdrawal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-blue-500" />
                    <div>
                      <CardTitle className="text-lg">提现 #{withdrawal.id}</CardTitle>
                      <CardDescription className="mt-1">
                        {withdrawal.wallet_address.slice(0, 10)}...{withdrawal.wallet_address.slice(-8)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(withdrawal.status)}
                  </div>
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
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      燃烧金额
                    </p>
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
                    <p className="text-sm font-mono flex items-center gap-2">
                      {withdrawal.tx_hash}
                      <ExternalLink className="w-3 h-3" />
                    </p>
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
                        setSelectedWithdrawal(withdrawal)
                        setActionType('approve')
                        setActionDialog(true)
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      批准
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedWithdrawal(withdrawal)
                        setActionType('reject')
                        setActionDialog(true)
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      拒绝
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 操作对话框 */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? '批准提现' : '拒绝提现'}
            </DialogTitle>
            <DialogDescription>
              {selectedWithdrawal && (
                <span>
                  提现金额: {parseFloat(selectedWithdrawal.actual_amount).toLocaleString()} ASHVA
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionType === 'approve' && (
              <div>
                <Label htmlFor="tx_hash">交易哈希</Label>
                <Input
                  id="tx_hash"
                  placeholder="0x..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                />
              </div>
            )}
            
            {actionType === 'reject' && (
              <div>
                <Label htmlFor="reject_reason">拒绝原因</Label>
                <Input
                  id="reject_reason"
                  placeholder="请输入拒绝原因"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAction}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
