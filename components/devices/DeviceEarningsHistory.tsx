'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface DailyRecord {
  income_date: string;
  total_income: number;
  flow: number;
  fine: number;
  fine_reason: string;
  status: number;
  status_text: string;
}

interface EarningsData {
  device_id: string;
  total_earnings: number;
  avg_daily: number;
  days_count: number;
  daily_records: DailyRecord[];
}

export function DeviceEarningsHistory({ deviceId }: { deviceId: string }) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');

  useEffect(() => {
    fetchData();
  }, [deviceId, days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/devices/${deviceId}/earnings?days=${days}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('获取数据失败:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-white">加载中...</div>;
  }

  if (!data || data.days_count === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">暂无历史数据</p>
        <p className="text-xs text-gray-500">请先同步数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 时间选择 */}
      <div className="flex gap-2 justify-end">
        {['7','30','90','180'].map(d => (
          <Button 
            key={d} 
            onClick={() => setDays(d)} 
            size="sm" 
            variant={days===d?'default':'outline'}
            className="text-xs"
          >
            {d}天
          </Button>
        ))}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded">
          <div className="text-xs text-gray-400 mb-1">总收入</div>
          <div className="text-2xl font-bold text-green-400">¥{data.total_earnings.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded">
          <div className="text-xs text-gray-400 mb-1">日均收入</div>
          <div className="text-2xl font-bold text-blue-400">¥{data.avg_daily.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded">
          <div className="text-xs text-gray-400 mb-1">记录天数</div>
          <div className="text-2xl font-bold text-purple-400">{data.days_count}</div>
        </div>
      </div>

      {/* 明细表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-2 text-gray-400">日期</th>
              <th className="text-right p-2 text-gray-400">收入</th>
              <th className="text-right p-2 text-gray-400">流量(GB)</th>
              <th className="text-right p-2 text-gray-400">罚款</th>
              <th className="text-center p-2 text-gray-400">状态</th>
            </tr>
          </thead>
          <tbody>
            {data.daily_records.map(r => (
              <tr key={r.income_date} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="p-2 text-white">{r.income_date}</td>
                <td className="text-right p-2 text-green-400">¥{r.total_income.toFixed(2)}</td>
                <td className="text-right p-2 text-blue-400">{r.flow.toFixed(2)}</td>
                <td className="text-right p-2 text-red-400">
                  {r.fine > 0 ? `-¥${r.fine.toFixed(2)}` : '-'}
                  {r.fine_reason && (
                    <div className="text-xs text-gray-500">{r.fine_reason}</div>
                  )}
                </td>
                <td className="text-center p-2">
                  <span className={r.status === 1 ? 'text-green-400' : 'text-yellow-400'}>
                    {r.status_text}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
