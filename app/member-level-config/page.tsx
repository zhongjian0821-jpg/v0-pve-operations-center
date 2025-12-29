'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LevelConfig {
  id: number;
  level_number: number;
  level_name: string;
  min_ashva_holdings: number;
  commission_rate: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function MemberLevelConfigPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<LevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LevelConfig | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/login'); return; }
    fetchConfigs();
  }, []);
  
  const fetchConfigs = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/member-level-config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setConfigs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该配置？')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/member-level-config?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('删除成功');
        fetchConfigs();
      }
    } catch (error) {
      alert('删除失败');
    }
  };
  
  if (loading) return <div className="p-8">Loading...</div>;
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">🎯 会员等级配置</h1>
          <div className="flex gap-3">
            <button 
              onClick={() => { setEditingConfig(null); setShowModal(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              + 添加配置
            </button>
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">返回首页</button>
          </div>
        </div>
        
        <div className="grid gap-4">
          {configs.map((config) => (
            <div key={config.id} className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-blue-400">LV{config.level_number}</span>
                    <span className="text-xl font-semibold">{config.level_name}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <div className="text-gray-400 text-sm">最小持仓</div>
                      <div className="text-lg font-semibold text-green-400">{config.min_ashva_holdings.toLocaleString()} ASHVA</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">佣金比例</div>
                      <div className="text-lg font-semibold text-yellow-400">{config.commission_rate}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">描述</div>
                      <div className="text-sm">{config.description || '无'}</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingConfig(config); setShowModal(true); }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    编辑
                  </button>
                  <button 
                    onClick={() => handleDelete(config.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {configs.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            暂无配置，请添加
          </div>
        )}
      </div>
      
      {showModal && (
        <ConfigModal 
          config={editingConfig}
          onClose={() => setShowModal(false)}
          onSave={() => { fetchConfigs(); setShowModal(false); }}
        />  
      )}
    </div>
  );
}

function ConfigModal({ config, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    level_number: config?.level_number || '',
    level_name: config?.level_name || '',
    min_ashva_holdings: config?.min_ashva_holdings || '',
    commission_rate: config?.commission_rate || '',
    description: config?.description || ''
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('admin_token');
      const url = config 
        ? '/api/admin/member-level-config'
        : '/api/admin/member-level-config';
      const method = config ? 'PUT' : 'POST';
      const body = config 
        ? { id: config.id, ...formData }
        : formData;
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      if (data.success) {
        alert(config ? '更新成功' : '创建成功');
        onSave();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      alert('操作失败');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">{config ? '编辑配置' : '添加配置'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">等级编号</label>
              <input
                type="number"
                value={formData.level_number}
                onChange={(e) => setFormData({ ...formData, level_number: parseInt(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">等级名称</label>
              <input
                type="text"
                value={formData.level_name}
                onChange={(e) => setFormData({ ...formData, level_name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">最小持仓 (ASHVA)</label>
              <input
                type="number"
                value={formData.min_ashva_holdings}
                onChange={(e) => setFormData({ ...formData, min_ashva_holdings: parseFloat(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">佣金比例 (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-24"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
              保存
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
