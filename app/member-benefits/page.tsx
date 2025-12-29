"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"

interface Benefit {
  id: number
  level: string
  name: string
  description: string
  value: string
  icon: string
}

export default function MemberBenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null)

  useEffect(() => {
    loadBenefits()
  }, [])

  const loadBenefits = async () => {
    try {
      // TODO: 替换为实际API
      const mockData: Benefit[] = [
        { id: 1, level: "普通会员", name: "基础收益", description: "享受基础收益分配", value: "100%", icon: "💰" },
        { id: 2, level: "银牌会员", name: "提升收益", description: "收益提升10%", value: "110%", icon: "🥈" },
        { id: 3, level: "金牌会员", name: "高级收益", description: "收益提升20%", value: "120%", icon: "🥇" },
        { id: 4, level: "钻石会员", name: "VIP收益", description: "收益提升30%", value: "130%", icon: "💎" }
      ]
      setBenefits(mockData)
    } catch (error) {
      console.error("加载权益失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (benefit: Benefit) => {
    setEditingBenefit(benefit)
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("确定要删除这个权益吗？")) {
      // TODO: 调用删除API
      setBenefits(benefits.filter(b => b.id !== id))
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">会员权益配置</h1>
          <p className="text-muted-foreground mt-1">管理不同等级会员的专属权益</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBenefit(null)}>
              <Plus className="mr-2 h-4 w-4" />
              添加权益
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBenefit ? "编辑权益" : "添加权益"}</DialogTitle>
              <DialogDescription>配置会员等级的专属权益内容</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>会员等级</Label>
                <Input placeholder="例如：金牌会员" />
              </div>
              <div className="grid gap-2">
                <Label>权益名称</Label>
                <Input placeholder="例如：收益加成" />
              </div>
              <div className="grid gap-2">
                <Label>权益描述</Label>
                <Input placeholder="详细描述此权益" />
              </div>
              <div className="grid gap-2">
                <Label>权益值</Label>
                <Input placeholder="例如：120%" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
              <Button onClick={() => setIsOpen(false)}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>权益列表</CardTitle>
          <CardDescription>共 {benefits.length} 项会员权益</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>图标</TableHead>
                  <TableHead>会员等级</TableHead>
                  <TableHead>权益名称</TableHead>
                  <TableHead>权益描述</TableHead>
                  <TableHead>权益值</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benefits.map((benefit) => (
                  <TableRow key={benefit.id}>
                    <TableCell><span className="text-2xl">{benefit.icon}</span></TableCell>
                    <TableCell>
                      <Badge variant="outline">{benefit.level}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{benefit.name}</TableCell>
                    <TableCell>{benefit.description}</TableCell>
                    <TableCell>
                      <Badge>{benefit.value}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(benefit)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(benefit.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
