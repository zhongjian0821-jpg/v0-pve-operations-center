'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DailyEarning {
  income_date: string;
  daily_income_cny: number;
  daily_income_ashva: number;
  flow_gb: number;
  fine_cny: number;
  net_income_ashva: number;
}

interface EarningsData {
  device_id: string;
  total_earnings_cny: number;
  total_earnings_ashva: number;
  avg_daily_cny: number;
  avg_daily_ashva: number;
  days_count: number;
  daily_records: DailyEarning[];
}

export function DeviceEarningsHistory({ deviceId }: { deviceId: string }) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');

  useEffect(() => {
    fetch(`/api/devices/${deviceId}/earnings?days=${days}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [deviceId, days]);

  if (loading) return <div className="text-center py-8 text-white">Loading...</div>;
  if (!data) return <div className="text-center py-8 text-red-400">No data</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['7','30','90','180'].map(d => (
          <Button key={d} onClick={() => setDays(d)} size="sm" variant={days===d?'default':'outline'}>
            {d}天
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-green-500/20 rounded">
          <div className="text-xs text-gray-400">Total CNY</div>
          <div className="text-xl font-bold text-green-400">¥{data.total_earnings_cny.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-blue-500/20 rounded">
          <div className="text-xs text-gray-400">Total ASHVA</div>
          <div className="text-xl font-bold text-blue-400">{data.total_earnings_ashva.toFixed(4)}</div>
        </div>
        <div className="p-4 bg-purple-500/20 rounded">
          <div className="text-xs text-gray-400">Avg/Day CNY</div>
          <div className="text-xl font-bold text-purple-400">¥{data.avg_daily_cny.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-orange-500/20 rounded">
          <div className="text-xs text-gray-400">Avg/Day ASHVA</div>
          <div className="text-xl font-bold text-orange-400">{data.avg_daily_ashva.toFixed(4)}</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-2 text-gray-400">Date</th>
              <th className="text-right p-2 text-gray-400">CNY</th>
              <th className="text-right p-2 text-gray-400">ASHVA</th>
              <th className="text-right p-2 text-gray-400">Flow(GB)</th>
              <th className="text-right p-2 text-gray-400">Fine</th>
              <th className="text-right p-2 text-gray-400">Net ASHVA</th>
            </tr>
          </thead>
          <tbody>
            {data.daily_records.map(r => (
              <tr key={r.income_date} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="p-2 text-white">{r.income_date}</td>
                <td className="text-right p-2 text-green-400">¥{r.daily_income_cny.toFixed(2)}</td>
                <td className="text-right p-2 text-blue-400">{r.daily_income_ashva.toFixed(4)}</td>
                <td className="text-right p-2 text-gray-300">{r.flow_gb.toFixed(2)}</td>
                <td className="text-right p-2 text-red-400">{r.fine_cny>0?`-¥${r.fine_cny.toFixed(2)}`:'-'}</td>
                <td className="text-right p-2 text-purple-400">{r.net_income_ashva.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
