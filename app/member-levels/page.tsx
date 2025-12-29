'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MemberLevel {
  level_name: string;
  ashva_balance: number;
  member_level: string;
  commission_rate_level1: number;
  commission_rate_level2: number;
  parent_wallet: string | null;
  team_size: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

interface MemberLevelFormData {
  level_name: string;
  ashva_balance: number;
  member_level: string;
  commission_rate_level1: number;
  commission_rate_level2: number;
  parent_wallet: string;
}

export default function MemberLevelsManagementPage() {
  const router = useRouter();
  const [memberLevels, setMemberLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMemberLevel, setEditingMemberLevel] = useState<MemberLevel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchMemberLevels();
  }, [router]);

  const fetchMemberLevels = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/member-levels', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMemberLevels(data.data || data.data || []);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: MemberLevelFormData) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/member-levels', {
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
        fetchMemberLevels();
        setShowCreateModal(false);
      } else {
        alert('创建失败: ' + data.error);
      }
    } catch (error: any) {
      alert('创建失败: ' + error.message);
    }
  };

  const handleUpdate = async (level_name: string, formData: MemberLevelFormData) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/member-levels', {
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
        fetchMemberLevels();
        setEditingMemberLevel(null);
      } else {
        alert('更新失败: ' + data.error);
      }
    } catch (error: any) {
      alert('更新失败: ' + error.message);
    }
  };

  const handleDelete = async (level_name: string) => {
    if (!confirm(`确定要删除钱包 ${level_name.substring(0, 10)}... 吗？\n\n注意：这将会删除所有相关数据！`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/member-levels?level_name=${level_name}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('删除成功！');
        fetchMemberLevels();
      } else {
        alert('删除失败: ' + data.error);
      }
    } catch (error: any) {
      alert('删除失败: ' + error.message);
    }
  };

  const filteredMemberLevels = memberLevels.filter(wallet => {
    const matchesSearch = wallet.level_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLevel === 'all' || wallet.member_level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const getMemberLevelBadge = (level: string) => {
    const styles = {
      normal: 'bg-gray-500/20 text-gray-300',
      market_partner: 'bg-blue-500/20 text-blue-300',
      global_partner: 'bg-purple-500/20 text-purple-300'
    };
    const names = {
      normal: '普通会员',
      market_partner: '市场合伙人',
      global_partner: '全球合伙人'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[level as keyof typeof styles] || styles.normal}`}>
        {names[level as keyof typeof names] || level}
      </span>
    );
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🏆 会员等级配置</h1>
            <p className="text-slate-400">管理会员等级、佣金比例和权益设置</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
          >
            <span>➕</span>
            <span>创建钱包</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">搜索钱包地址</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="输入钱包地址..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">会员等级筛选</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">全部等级</option>
                <option value="normal">普通会员</option>
                <option value="market_partner">市场合伙人</option>
                <option value="global_partner">全球合伙人</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">总钱包数</div>
            <div className="text-2xl font-bold text-white">{memberLevels.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">普通会员</div>
            <div className="text-2xl font-bold text-gray-300">{memberLevels.filter(w => w.member_level === 'normal').length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">市场合伙人</div>
            <div className="text-2xl font-bold text-blue-300">{memberLevels.filter(w => w.member_level === 'market_partner').length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">全球合伙人</div>
            <div className="text-2xl font-bold text-purple-300">{memberLevels.filter(w => w.member_level === 'global_partner').length}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">钱包地址</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">ASHVA余额</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">会员等级</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">佣金比例</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">团队人数</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">总收益</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMemberLevels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  filteredMemberLevels.map((wallet) => (
                    <tr key={wallet.level_name} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-slate-300">
                          {wallet.level_name.substring(0, 10)}...{wallet.level_name.substring(38)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                        {Number(wallet.ashva_balance || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {getMemberLevelBadge(wallet.member_level)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        L1: {wallet.commission_rate_level1}% / L2: {wallet.commission_rate_level2}%
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {wallet.team_size || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-400 font-semibold">
                        {Number(wallet.total_earnings || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingMemberLevel(wallet)}
                            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-sm font-medium transition"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(wallet.level_name)}
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

      {/* Create Modal */}
      {showCreateModal && (
        <MemberLevelFormModal
          title="创建钱包"
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editingMemberLevel && (
        <MemberLevelFormModal
          title="编辑钱包"
          initialData={editingMemberLevel}
          onSubmit={(data) => handleUpdate(editingMemberLevel.level_name, data)}
          onClose={() => setEditingMemberLevel(null)}
        />
      )}
    </div>
  );
}

function MemberLevelFormModal({ title, initialData, onSubmit, onClose }: {
  title: string;
  initialData?: MemberLevel;
  onSubmit: (data: MemberLevelFormData) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<MemberLevelFormData>({
    level_name: initialData?.level_name || '',
    ashva_balance: initialData?.ashva_balance || 0,
    member_level: initialData?.member_level || 'normal',
    commission_rate_level1: initialData?.commission_rate_level1 || 3.0,
    commission_rate_level2: initialData?.commission_rate_level2 || 2.0,
    parent_wallet: initialData?.parent_wallet || ''
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
              钱包地址 *
            </label>
            <input
              type="text"
              required
              disabled={!!initialData}
              value={formData.level_name}
              onChange={(e) => setFormData({ ...formData, level_name: e.target.value })}
              placeholder="0x..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ASHVA余额
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.ashva_balance}
                onChange={(e) => setFormData({ ...formData, ashva_balance: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                会员等级
              </label>
              <select
                value={formData.member_level}
                onChange={(e) => setFormData({ ...formData, member_level: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="normal">普通会员</option>
                <option value="market_partner">市场合伙人</option>
                <option value="global_partner">全球合伙人</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                一级佣金比例 (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.commission_rate_level1}
                onChange={(e) => setFormData({ ...formData, commission_rate_level1: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                二级佣金比例 (%)
              </label>
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
              推荐人地址
            </label>
            <input
              type="text"
              value={formData.parent_wallet}
              onChange={(e) => setFormData({ ...formData, parent_wallet: e.target.value })}
              placeholder="0x... (可选)"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
