
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Server, ImageIcon, Edit, Save, X } from 'lucide-react'

interface Product {
  id: number
  product_id: string
  name: string
  description: string
  node_type: 'cloud' | 'image'
  order_type: 'hosting' | 'image'
  base_price: number
  staking_required: number
  is_active: boolean
  features: string[]
  created_at: string
  updated_at: string
}

export default function ProductCenterPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Product>>({})

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('获取产品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setEditForm({ ...product })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveProduct = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchProducts()
        setEditingId(null)
        setEditForm({})
        alert('产品更新成功!')
      } else {
        alert('更新失败: ' + data.error)
      }
    } catch (error) {
      console.error('保存产品失败:', error)
      alert('保存失败')
    }
  }

  const getProductIcon = (nodeType: string) => {
    return nodeType === 'cloud' ? (
      <Server className="w-12 h-12 text-blue-500" />
    ) : (
      <ImageIcon className="w-12 h-12 text-purple-500" />
    )
  }

  const getProductBadge = (nodeType: string) => {
    return nodeType === 'cloud' ? (
      <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
        云节点托管
      </Badge>
    ) : (
      <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">
        镜像节点
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载产品数据...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-3xl font-bold">产品中心</h1>
        <p className="text-gray-600 mt-2">
          管理云节点托管和镜像节点产品 | 价格修改将同步到 Web3 会员中心
        </p>
      </div>

      {/* 产品卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => {
          const isEditing = editingId === product.id
          const formData = isEditing ? editForm : product

          return (
            <Card key={product.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {getProductIcon(product.node_type)}
                    <div>
                      <CardTitle className="text-2xl">{product.name}</CardTitle>
                      {getProductBadge(product.node_type)}
                    </div>
                  </div>
                  
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(product)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 描述 */}
                <div>
                  <label className="text-sm font-medium text-gray-600">产品描述</label>
                  {isEditing ? (
                    <Input
                      value={formData.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-700 mt-1">{product.description}</p>
                  )}
                </div>

                {/* 基础价格 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">基础价格</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={parseFloat(formData.base_price || 0)}
                        onChange={(e) => setEditForm({ ...editForm, base_price: parseFloat(e.target.value) })}
                        className="mt-1"
                        step="0.01"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-blue-600 mt-1">
                        {parseFloat(product.base_price).toFixed(2)} ASHVA
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">质押要求</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={parseFloat(formData.staking_required || 0)}
                        onChange={(e) => setEditForm({ ...editForm, staking_required: parseFloat(e.target.value) })}
                        className="mt-1"
                        step="0.01"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-purple-600 mt-1">
                        {parseFloat(product.staking_required).toFixed(2)} ASHVA
                      </div>
                    )}
                  </div>
                </div>

                {/* 产品特性 */}
                <div>
                  <label className="text-sm font-medium text-gray-600">产品特性</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.features.map((feature, index) => (
                      <Badge key={index} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 产品状态 */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-sm text-gray-600">产品状态: </span>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? '上架中' : '已下架'}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    更新于: {new Date(product.updated_at).toLocaleString('zh-CN')}
                  </div>
                </div>

                {/* 编辑操作按钮 */}
                {isEditing && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={saveProduct}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存修改
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelEdit}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      取消
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 同步说明 */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            重要说明
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>价格同步机制:</strong> 在产品中心修改产品价格后,更改将立即同步到 Web3 会员中心 (www.ashvacoin.org/purchase)
          </p>
          <p>
            <strong>影响范围:</strong> 价格修改只影响新订单,已有订单的价格不会改变
          </p>
          <p>
            <strong>数据源:</strong> PVE 运营中心是唯一的产品数据管理后台,Web3 会员中心通过 API 获取产品信息
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
