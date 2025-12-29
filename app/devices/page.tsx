'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Purchase {
  id: number;
  wallet_address: string;
  node_type: string;
  quantity: number;
  price_per_node: number;
  total_price: number;
  transaction_hash: string;
  status: string;
  created_at: string;
}

export default function CloudNodePurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPurchases();
  }, [router]);

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPurchases(data.data.records || []);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        fetchPurchases();
        setShowModal(false);
        alert('创建成功！');
      } else {
        alert('创建失败：' + data.error);
      }
    } catch (error) {
      alert('创建失败');
    }
  };

  const handleUpdate = async (formData: any) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/devices', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: editingPurchase?.id, ...formData })
      });
      const data = await response.json();
      if (data.success) {
        fetchPurchases();
        setShowModal(false);
        setEditingPurchase(null);
        alert('更新成功！');
      } else {
        alert('更新失败：' + data.error);
      }
    } catch (error) {
      alert('更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/devices?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchPurchases();
        alert('删除成功！');
      } else {
        alert('删除失败：' + data.error);
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.node_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: purchases.length,
    pending: purchases.filter(p => p.status === 'pending').length,
    completed: purchases.filter(p => p.status === 'completed').length,
    totalValue: purchases.reduce((sum, p) => sum + Number(p.total_price || 0), 0)
  };

  if (loading) return <div className="p-8">加载中...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">设备管理</h1>
          <p className="text-gray-500 mt-1">管理设备记录</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">返回</button>
          <button onClick={() => { setEditingPurchase(null); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ 新建购买记录</button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">总记录数</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">待处理</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">已完成</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">总金额</div>
          <div className="text-2xl font-bold mt-1">${stats.totalValue.toFixed(2)}</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索钱包地址或节点类型..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
          </select>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">钱包地址</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">节点类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">总价</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPurchases.map((purchase) => (
              <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm">{purchase.id}</td>
                <td className="px-4 py-3 text-sm font-mono">{purchase.wallet_address?.slice(0, 10)}...</td>
                <td className="px-4 py-3 text-sm">{purchase.node_type}</td>
                <td className="px-4 py-3 text-sm">{purchase.quantity}</td>
                <td className="px-4 py-3 text-sm">${purchase.total_price}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                    purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {purchase.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button onClick={() => { setEditingPurchase(purchase); setShowModal(true); }} className="text-blue-600 hover:underline mr-2">编辑</button>
                  <button onClick={() => handleDelete(purchase.id)} className="text-red-600 hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 模态框 */}
      {showModal && (
        <PurchaseModal
          purchase={editingPurchase}
          onClose={() => { setShowModal(false); setEditingPurchase(null); }}
          onSubmit={editingPurchase ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
}

function PurchaseModal({ purchase, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    wallet_address: purchase?.wallet_address || '',
    node_type: purchase?.node_type || 'cloud',
    quantity: purchase?.quantity || 1,
    price_per_node: purchase?.price_per_node || 2000,
    total_price: purchase?.total_price || 2000,
    transaction_hash: purchase?.transaction_hash || '',
    status: purchase?.status || 'pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{purchase ? '编辑购买记录' : '新建购买记录'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">钱包地址</label>
            <input
              type="text"
              value={formData.wallet_address}
              onChange={(e) => setFormData({...formData, wallet_address: e.target.value})}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">节点类型</label>
            <input
              type="text"
              value={formData.node_type}
              onChange={(e) => setFormData({...formData, node_type: e.target.value})}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">数量</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">单价</label>
            <input
              type="number"
              value={formData.price_per_node}
              onChange={(e) => setFormData({...formData, price_per_node: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">总价</label>
            <input
              type="number"
              value={formData.total_price}
              onChange={(e) => setFormData({...formData, total_price: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="pending">待处理</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">提交</button>
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}
