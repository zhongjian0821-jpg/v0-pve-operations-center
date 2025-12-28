'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MemberLevelConfig {
  id: number;
  level_name: string;
  min_ashva_amount: number;
  min_usd_value: number;
  commission_rate_level1: number;
  commission_rate_level2: number;
  benefits: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ConfigFormData {
  id?: number;
  level_name: string;
  min_ashva_amount: number;
  min_usd_value: number;
  commission_rate_level1: number;
  commission_rate_level2: number;
  benefits: string;
  is_active: boolean;
}

export default function MemberLevelConfigPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<MemberLevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<MemberLevelConfig | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchConfigs();
  }, [router]);

  const fetchConfigs = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/member-level-config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setConfigs(data.data.configs || data.data || []);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: ConfigFormData) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/member-level-config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        alert('创建成功！');
        fetchConfigs();
        setShowCreateModal(false);
      } else {
        alert('创建失败: ' + data.error);
      }
    } catch (error: any) {
      alert('创建失败: ' + error.message);
    }
  };

  const handleUpdate = async (formData: ConfigFormData) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/member-level-config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        alert('更新成功！');
        fetchConfigs();
        setEditingConfig(null);
      } else {
        alert('更新失败: ' + data.error);
      }
    } catch (error: any) {
      alert('更新失败: ' + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个等级配置吗？')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/member-level-config?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('删除成功！');
        fetchConfigs();
      } else {
        alert('删除失败: ' + data.error);
      }
    } catch (error: any) {
      alert('删除失败: ' + error.message);
    }
  };

  const toggleActive = async (config: MemberLevelConfig) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/member-level-config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...config,
          is_active: !config.is_active
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchConfigs();
      } else {
        alert('操作失败: ' + data.error);
      }
    } catch (error: any) {
      alert('操作失败: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-blue-400 text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">⚙️ 会员等级配置</h1>
            <p className="text-slate-400">管理会员等级规则和权益</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              ← 返回首页
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <span>➕</span>
              <span>创建等级</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">总配置数</div>
            <div className="text-2xl font-bold text-white">{configs.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">启用中</div>
            <div className="text-2xl font-bold text-green-400">{configs.filter(c => c.is_active).length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">已禁用</div>
            <div className="text-2xl font-bold text-red-400">{configs.filter(c => !c.is_active).length}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">等级名称</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">最低ASHVA</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">最低USD</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">佣金比例</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {configs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      暂无配置
                    </td>
                  </tr>
                ) : (
                  configs.map((config) => (
                    <tr key={config.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 text-sm text-white">{config.level_name}</td>
                      <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                        {Number(config.min_ashva_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-400 font-semibold">
                        ${Number(config.min_usd_value).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        L1: {config.commission_rate_level1}% / L2: {config.commission_rate_level2}%
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(config)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            config.is_active
                              ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          }`}
                        >
                          {config.is_active ? '已启用' : '已禁用'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingConfig(config)}
                            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-sm font-medium transition"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm font-medium transition"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <ConfigFormModal
          title="创建等级配置"
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingConfig && (
        <ConfigFormModal
          title="编辑等级配置"
          initialData={editingConfig}
          onSubmit={handleUpdate}
          onClose={() => setEditingConfig(null)}
        />
      )}
    </div>
  );
}

function ConfigFormModal({ title, initialData, onSubmit, onClose }: {
  title: string;
  initialData?: MemberLevelConfig;
  onSubmit: (data: ConfigFormData) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<ConfigFormData>({
    id: initialData?.id,
    level_name: initialData?.level_name || '',
    min_ashva_amount: initialData?.min_ashva_amount || 0,
    min_usd_value: initialData?.min_usd_value || 0,
    commission_rate_level1: initialData?.commission_rate_level1 || 3.0,
    commission_rate_level2: initialData?.commission_rate_level2 || 2.0,
    benefits: initialData?.benefits || '',
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true
  });

  const handleSubmit = (e: React.FormEvent) => {  
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">等级名称 *</label>
            <select
              required
              value={formData.level_name}
              onChange={(e) => setFormData({ ...formData, level_name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">请选择</option>
              <option value="normal">普通会员</option>
              <option value="market_partner">市场合伙人</option>
              <option value="global_partner">全球合伙人</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">最低ASHVA持有量 *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.min_ashva_amount}
                onChange={(e) => setFormData({ ...formData, min_ashva_amount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">最低USD价值 *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.min_usd_value}
                onChange={(e) => setFormData({ ...formData, min_usd_value: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">一级佣金比例 (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.commission_rate_level1}
                onChange={(e) => setFormData({ ...formData, commission_rate_level1: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">二级佣金比例 (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.commission_rate_level2}
                onChange={(e) => setFormData({ ...formData, commission_rate_level2: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">会员权益说明</label>
            <textarea
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              rows={4}
              placeholder="输入会员权益描述..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-300">启用此等级</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
              保存
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
