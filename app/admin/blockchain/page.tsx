'use client';

// 计算灵瀚云流量数据
function calculateLinghanTraffic(apiData: any) {
  if (!apiData || !apiData.upList || !apiData.downList) {
    return { totalTraffic: 0, inTraffic: 0, outTraffic: 0 };
  }
  
  // upList/downList 单位是 Mbps，每个数据点代表5分钟的平均速率
  // 计算总流量：速率(Mbps) * 时间(300秒) / 8(bit转byte) = MB
  const upTotal = apiData.upList.reduce((sum: number, val: string) => sum + parseFloat(val || '0'), 0);
  const downTotal = apiData.downList.reduce((sum: number, val: string) => sum + parseFloat(val || '0'), 0);
  
  // Mbps * 300s / 8 = MB
  const upTrafficMB = (upTotal * 300) / 8;
  const downTrafficMB = (downTotal * 300) / 8;
  
  return {
    totalTraffic: upTrafficMB + downTrafficMB,  // MB
    inTraffic: downTrafficMB,                     // MB
    outTraffic: upTrafficMB                       // MB
  };
}


import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 灵瀚云API配置
const LINGHAN_CONFIG = {
  baseUrl: 'https://lhy.linghanyun.com/oemApi/faDev/common',
  ak: 'cb4e1cc5599d433896bfeb0c94995780',
  as: '37f005ebee964853ae6dc96f8ca28792'
};

// 调用灵瀚云API（通过后端代理）
async function callLinghanAPI(endpoint: string, method = 'GET', body: any = null) {
  try {
    const response = await fetch('/api/linghan/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint,
        method,
        data: body
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.error('代理API错误:', result.error);
      return { code: 500, message: result.error };
    }
  } catch (error) {
    console.error('灵瀚云API调用失败:', error);
    return { code: 500, message: '网络错误' };
  }
}

// 节点类型定义
const NODE_TYPES = [
  { value: 'cosmos', label: 'Cosmos Hub', hourlyEarning: 0.22, dailyEarning: 5.20, color: 'blue', type: 'blockchain' },
  { value: 'polygon', label: 'Polygon', hourlyEarning: 0.35, dailyEarning: 8.50, color: 'purple', type: 'blockchain' },
  { value: 'near', label: 'NEAR', hourlyEarning: 0.26, dailyEarning: 6.30, color: 'green', type: 'blockchain' },
  { value: 'sui', label: 'Sui', hourlyEarning: 0.53, dailyEarning: 12.80, color: 'pink', type: 'blockchain' },
  { value: 'linghan', label: '灵瀚云设备', hourlyEarning: 0.0, dailyEarning: 0.0, color: 'orange', type: 'linghan' },
];


      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">批量导入灵瀚云设备</h3>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setDeviceIdsInput('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                设备ID列表
                <span className="text-gray-500 ml-2 text-xs">
                  (每行一个ID，或用逗号/空格分隔)
                </span>
              </label>
              <textarea
                value={deviceIdsInput}
                onChange={(e) => setDeviceIdsInput(e.target.value)}
                placeholder="请输入设备ID，例如:\n4074445e\n150873b1\n79b9f541\n008c4a9a\n\n或者用逗号分隔：4074445e, 150873b1, 79b9f541"
                className="w-full h-64 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                style={{ resize: 'vertical' }}
              />
              <div className="mt-2 text-sm text-gray-400">
                {deviceIdsInput.split(/[\n,\s]+/).filter(id => id.trim().length > 0).length} 个设备ID
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImportLinghanDevices}
                disabled={importing || !deviceIdsInput.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {importing ? '导入中...' : '确认导入'}
              </button>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setDeviceIdsInput('');
                }}
                disabled={importing}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:cursor-not-allowed"
              >
                取消
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-900 rounded text-sm text-gray-400">
              <div className="font-medium text-gray-300 mb-1">💡 使用说明：</div>
              <ul className="list-disc list-inside space-y-1">
                <li>每行输入一个设备ID</li>
                <li>也可以用逗号、空格分隔多个ID</li>
                <li>系统会自动去重和验证</li>
                <li>已存在的设备将被跳过</li>
              </ul>
            </div>
          </div>
        </div>
      )}


      
                              </div>
                              
                              {missing.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs text-yellow-400">可部署 ({missing.length}):</div>
                                  <div className="text-xs text-gray-500">
                                    {missing.map(t => t.label).join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {machines.length === 0 && (
                        <div className="text-center text-gray-500 py-8">暂无机器</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 中间和右侧部分保持与之前版本一致 - 省略以节省空间 */}
              
              {/* 中间：任务统计 */}
              <div className="lg:col-span-5">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">任务类型统计</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {taskStats.map(stat => (
                        <div key={stat.value} className="p-4 bg-gray-700/30 border border-gray-600 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <div className="font-bold text-white text-lg flex items-center gap-2">
                                {stat.label}
                                {stat.type === 'linghan' && (
                                  <span className="text-xs px-2 py-0.5 bg-orange-500/30 text-orange-300 rounded">
                                    灵瀚云
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400">
                                {stat.totalCount} 台机器 · {stat.runningCount} 运行中
                              </div>
                            </div>
                            <div className="text-right">
                              {stat.type === 'blockchain' ? (
                                <>
                                  <div className="text-2xl font-bold text-green-400">${stat.hourlyTotal}/时</div>
                                  <div className="text-sm text-gray-400">${stat.dailyTotal}/天</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-sm text-gray-400 mr-3">收益数据在监控面板查看</div>
                                  {/* 灵瀚云专属按钮 */}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setActiveTab('linghan')}
                                      className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded text-sm transition-all whitespace-nowrap"
                                    >
                                      📋 查看任务
                                    </button>
                                    <button
                                      onClick={() => setImportModalOpen(true)}
                                      disabled={importing}
                                      className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 rounded text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                      {importing ? '⏳ 导入中...' : '📥 批量导入'}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 右侧：部署表单 */}
              <div className="lg:col-span-3">
                <Card className="bg-gray-800/50 border-gray-700 sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-white">部署新任务</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedMachineData && (
                        <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded">
                          <div className="text-sm font-bold text-blue-300 mb-1">选中机器</div>
                          <div className="text-white font-medium">{selectedMachineData.machine_name}</div>
                          <div className="text-xs text-gray-400">{selectedMachineData.ip_address}</div>
                          
                          {selectedMachineNodes.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-blue-500/30">
                              <div className="text-xs text-blue-300 mb-1">已部署:</div>
                              <div className="flex flex-wrap gap-1">
                                {selectedMachineNodes.map(node => {
                                  const nodeType = NODE_TYPES.find(t => t.value === node.node_type);
                                  return (
                                    <span key={node.id} className="px-1.5 py-0.5 bg-blue-500/30 text-blue-200 text-xs rounded">
                                      {nodeType?.label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="text-white text-sm mb-2 block">选择机器</label>
                        <select 
                          className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                          value={selectedMachine || ''}
                          onChange={(e) => setSelectedMachine(Number(e.target.value))}
                        >
                          <option value="">请选择机器</option>
                          {machines.map(m => {
                            const nodeCount = nodes.filter(n => n.machine_id === m.id).length;
                            return (
                              <option key={m.id} value={m.id}>
                                {m.machine_name} ({m.ip_address}) {nodeCount > 0 ? `[${nodeCount}个任务]` : '[空闲]'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="text-white text-sm mb-2 block">任务类型</label>
                        <select 
                          className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                          value={deployForm.nodeType}
                          onChange={(e) => setDeployForm({...deployForm, nodeType: e.target.value})}
                        >
                          {NODE_TYPES.map(type => {
                            const alreadyDeployed = selectedMachine && nodes.some(
                              n => n.machine_id === selectedMachine && n.node_type === type.value
                            );
                            return (
                              <option key={type.value} value={type.value}>
                                {type.label} {type.type === 'linghan' ? '🌐' : `($${type.hourlyEarning}/时)`} {alreadyDeployed ? '✓已部署' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {deployForm.nodeType !== 'linghan' && (
                        <>
                          <div>
                            <label className="text-white text-sm mb-2 block">任务名称</label>
                            <input
                              type="text"
                              placeholder="例如: validator-1"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.nodeName}
                              onChange={(e) => setDeployForm({...deployForm, nodeName: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">Node ID</label>
                            <input
                              type="text"
                              placeholder="例如: node-001"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.nodeId}
                              onChange={(e) => setDeployForm({...deployForm, nodeId: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">钱包地址</label>
                            <input
                              type="text"
                              placeholder="例如: cosmos1abc..."
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.walletAddress}
                              onChange={(e) => setDeployForm({...deployForm, walletAddress: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      {deployForm.nodeType === 'linghan' && (
                        <>
                          <div>
                            <label className="text-white text-sm mb-2 block">设备名称</label>
                            <input
                              type="text"
                              placeholder="例如: 灵瀚设备-001"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.nodeName}
                              onChange={(e) => setDeployForm({...deployForm, nodeName: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">省份</label>
                            <input
                              type="text"
                              placeholder="例如: 广东"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.province}
                              onChange={(e) => setDeployForm({...deployForm, province: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">城市</label>
                            <input
                              type="text"
                              placeholder="例如: 深圳"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.city}
                              onChange={(e) => setDeployForm({...deployForm, city: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">运营商</label>
                            <select
                              className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                              value={deployForm.isp}
                              onChange={(e) => setDeployForm({...deployForm, isp: e.target.value})}
                            >
                              <option value="">请选择运营商</option>
                              <option value="电信">电信</option>
                              <option value="联通">联通</option>
                              <option value="移动">移动</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">上行带宽 (Mbps)</label>
                            <input
                              type="number"
                              placeholder="例如: 100"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.upBandwidth}
                              onChange={(e) => setDeployForm({...deployForm, upBandwidth: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-white text-sm mb-2 block">线路数量</label>
                            <input
                              type="number"
                              placeholder="例如: 1"
                              className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
                              value={deployForm.lineNumber}
                              onChange={(e) => setDeployForm({...deployForm, lineNumber: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      <button 
                        onClick={handleDeploy}
                        disabled={!selectedMachine || !deployForm.nodeName || deploying}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deploying ? '部署中...' : deployForm.nodeType === 'linghan' ? '添加灵瀚云设备' : '立即部署任务'}
                      </button>

                      {deployForm.nodeType !== 'linghan' && (
                        <div className="p-3 bg-green-500/20 border border-green-500/30 rounded">
                          <div className="text-sm text-white">
                            <div className="font-bold mb-1">预计收益</div>
                            <div className="text-xs text-green-300">
                              每小时: ${NODE_TYPES.find(t => t.value === deployForm.nodeType)?.hourlyEarning}
                            </div>
                            <div className="text-xs text-green-300">
                              每天: ${NODE_TYPES.find(t => t.value === deployForm.nodeType)?.dailyEarning}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* 灵瀚云设备监控标签页 */}
        {activeTab === 'linghan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 左侧：设备列表 */}
            <div className="lg:col-span-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>灵瀚云设备列表</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImportModalOpen(true)}
                        disabled={importing}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {importing ? '⏳' : '📥'} 批量导入
                      </button>
                      <button
                        onClick={loadLinghanDevices}
                        className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                      >
                        🔄 刷新
                      </button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {linghanLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                      <div className="text-gray-400 text-sm">加载中...</div>
                    </div>
                  ) : linghanDevices.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-4">📭</div>
                      <div className="text-lg mb-2">暂无灵瀚云设备</div>
                      <div className="text-sm text-gray-400 mb-4">还没有添加任何灵瀚云设备</div>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => setImportModalOpen(true)}
                          disabled={importing}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {importing ? '⏳ 导入中...' : '📥 批量导入现有设备'}
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('overview');
                            setDeployForm({...deployForm, nodeType: 'linghan'});
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all"
                        >
                          ➕ 手动添加新设备
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-3">
                        批量导入26个已绑定设备，或手动添加新设备
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {linghanDevices.map((device, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedLinghanDevice(device)}
                          className={`p-4 rounded-lg cursor-pointer transition-all border ${
                            selectedLinghanDevice?.devId === device.devId
                              ? 'bg-orange-500/30 border-orange-500'
                              : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-white">{device.devName || `设备-${device.devId}`}</div>
                              <div className="text-xs text-gray-400">{device.devId}</div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${
                              device.status === 1 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                            }`}>
                              {device.status === 1 ? '在线' : '离线'}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-300">
                            <div>📍 {device.province} {device.city}</div>
                            <div>🌐 {device.isp || '未知运营商'}</div>
                            <div>⚡ {device.upBandwidth || 0} Mbps</div>
                            {device.devType && (
                              <div className="text-orange-300">
                                类型: {device.devType === 1 ? '大节点' : '盒子'}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右侧：设备详情 */}
            <div className="lg:col-span-8">
              {!selectedLinghanDevice ? (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-20 text-center">
                    <div className="text-6xl mb-4">👈</div>
                    <div className="text-white text-xl mb-2">请选择一个设备</div>
                    <div className="text-gray-400">点击左侧设备查看详细信息</div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  
                  {/* 设备基本信息 */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">📊 设备详情</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {linghanLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                        </div>
                      ) : linghanDeviceDetail ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">设备ID</div>
                            <div className="text-white font-medium">{linghanDeviceDetail.devId || selectedLinghanDevice.devId}</div>
                          </div>
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">设备名称</div>
                            <div className="text-white font-medium">
                              {linghanDeviceDetail.beizhu || linghanDeviceDetail.devName || selectedLinghanDevice?.beizhu || selectedLinghanDevice?.devName || '未命名'}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">位置</div>
                            <div className="text-white font-medium">{linghanDeviceDetail.province} {linghanDeviceDetail.city}</div>
                          </div>
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">运营商</div>
                            <div className="text-white font-medium">{linghanDeviceDetail.isp || '未知'}</div>
                          </div>
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">上行带宽</div>
                            <div className="text-white font-medium">{linghanDeviceDetail.upBandwidth || 0} Mbps</div>
                          </div>
                          <div className="p-3 bg-gray-700/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">状态</div>
                            <div className="text-white font-medium">
                              {linghanDeviceDetail.status === 1 ? '🟢 在线' : '🔴 离线'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">加载中...</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 网卡信息 */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">🌐 网卡信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {linghanNetworkCards.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">暂无网卡信息</div>
                      ) : (
                        <div className="space-y-3">
                          {linghanNetworkCards.map((card, index) => (
                            <div key={index} className="p-3 bg-gray-700/30 rounded border border-gray-600">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-white">{card.name}</div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    速率: {card.speed || 'N/A'} · IP: {card.ip || 'N/A'}
                                  </div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  (card.speed && card.speed !== '-1' && card.speed !== -1) || card.ip ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                                }`}>
                                  {(card.speed && card.speed !== '-1' && card.speed !== -1) || card.ip ? '活跃' : '未激活'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 流量监控 */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">📈 流量监控（今日）</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {linghanTrafficData ? (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded text-center">
                            <div className="text-2xl font-bold text-blue-400">
                              {(linghanTrafficData.totalTraffic / 1024).toFixed(2)} GB
                            </div>
                            <div className="text-xs text-gray-400 mt-1">总流量</div>
                          </div>
                          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded text-center">
                            <div className="text-2xl font-bold text-green-400">
                              {(linghanTrafficData.inTraffic / 1024).toFixed(2)} GB
                            </div>
                            <div className="text-xs text-gray-400 mt-1">入站流量</div>
                          </div>
                          <div className="p-4 bg-orange-500/20 border border-orange-500/30 rounded text-center">
                            <div className="text-2xl font-bold text-orange-400">
                              {(linghanTrafficData.outTraffic / 1024).toFixed(2)} GB
                            </div>
                            <div className="text-xs text-gray-400 mt-1">出站流量</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">暂无流量数据</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 95带宽收益 */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">💰 95带宽收益</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {linghanBandwidth ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">收益日期</div>
                            <div className="text-white font-medium">
                              {new Date(linghanBandwidth.incomeDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">最近结算收益</div>
                            <div className="text-2xl font-bold text-yellow-400">
                              ¥{linghanBandwidth.totalIncome?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">罚款</div>
                            <div className="text-2xl font-bold text-red-400">
                              ¥{linghanBandwidth.fine?.toFixed(2) || '0.00'}
                            </div>
                            {linghanBandwidth.fineReason && (
                              <div className="text-xs text-gray-400 mt-1">原因: {linghanBandwidth.fineReason}</div>
                            )}
                          </div>
                          <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">流量</div>
                            <div className="text-white font-medium">
                              {linghanBandwidth.flow || 0} GB
                            </div>
                          </div>
                          <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded">
                            <div className="text-xs text-gray-400 mb-1">状态</div>
                            <div className="text-white font-medium">
                              {linghanBandwidth.status === 1 ? '✅ 已结算' : '⏳ 待结算'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">暂无收益数据</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 拨号信息（仅大节点） */}
                  {selectedLinghanDevice.devType === 1 && (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">📞 拨号信息（大节点）</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {linghanDialingInfo && Array.isArray(linghanDialingInfo) ? (
                          <div className="space-y-4">
                            {/* 汇总统计 */}
                            <div className="grid grid-cols-4 gap-4">
                              <div className="p-3 bg-gray-700/30 rounded text-center">
                                <div className="text-2xl font-bold text-white">
                                  {linghanDialingInfo.reduce((sum, nic) => sum + (nic.lineCount || 0), 0)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">总线数</div>
                              </div>
                              <div className="p-3 bg-green-500/20 rounded text-center">
                                <div className="text-2xl font-bold text-green-400">
                                  {linghanDialingInfo.reduce((sum, nic) => sum + (nic.haveDialCount || 0), 0)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">已拨号</div>
                              </div>
                              <div className="p-3 bg-orange-500/20 rounded text-center">
                                <div className="text-2xl font-bold text-orange-400">
                                  {linghanDialingInfo.reduce((sum, nic) => sum + (nic.notDialCount || 0), 0)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">未拨号</div>
                              </div>
                              <div className="p-3 bg-blue-500/20 rounded text-center">
                                <div className="text-2xl font-bold text-blue-400">
                                  {linghanDialingInfo.reduce((sum, nic) => sum + (nic.connectCount || 0), 0)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">已连接</div>
                              </div>
                            </div>
                            
                            {/* 网卡详情 */}
                            <div className="space-y-2">
                              {linghanDialingInfo.map((nic, idx) => (
                                <div key={idx} className="p-3 bg-gray-700/30 rounded">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-white">{nic.name}</span>
                                    <span className="text-xs text-gray-400">
                                      {nic.speed > 0 ? `${nic.speed} Mbps` : '未连接'}
                                    </span>
                                  </div>
                                  {nic.lineList && nic.lineList.length > 0 && (
                                    <div className="space-y-1 text-sm">
                                      {nic.lineList.map((line, lineIdx) => (
                                        <div key={lineIdx} className="flex items-center gap-2 text-gray-300">
                                          <span className={line.dialStatus ? "text-green-400" : "text-red-400"}>
                                            {line.dialStatus ? "✓" : "✗"}
                                          </span>
                                          <span>IP: {line.ip || '无'}</span>
                                          {line.gateway && <span className="text-gray-500">网关: {line.gateway}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">暂无拨号信息</div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

      

      {/* 批量导入设备ID对话框 */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">批量导入灵瀚云设备</h3>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setDeviceIdsInput('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                设备ID列表
                <span className="text-gray-500 ml-2 text-xs">
                  (每行一个ID，或用逗号/空格分隔)
                </span>
              </label>
              <textarea
                value={deviceIdsInput}
                onChange={(e) => setDeviceIdsInput(e.target.value)}
                placeholder="请输入设备ID，例如:
4074445e
150873b1
79b9f541
008c4a9a

或者用逗号分隔：4074445e, 150873b1, 79b9f541"
                className="w-full h-64 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
              <div className="mt-2 text-sm text-gray-400">
                {deviceIdsInput.split(/[
,\s]+/).filter((id: string) => id.trim().length > 0).length} 个设备ID
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImportLinghanDevices}
                disabled={importing || !deviceIdsInput.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {importing ? '导入中...' : '确认导入'}
              </button>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setDeviceIdsInput('');
                }}
                disabled={importing}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:cursor-not-allowed"
              >
                取消
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-900 rounded text-sm text-gray-400">
              <div className="font-medium text-gray-300 mb-1">💡 使用说明：</div>
              <ul className="list-disc list-inside space-y-1">
                <li>每行输入一个设备ID</li>
                <li>也可以用逗号、空格分隔多个ID</li>
                <li>系统会自动去重和验证</li>
                <li>已存在的设备将被跳过</li>
              </ul>
            </div>
          </div>
        </div>
      )}
</div>
    </div>
  );
}
