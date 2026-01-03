'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Activity } from 'lucide-react';

interface DailyEarning {
  income_date: string;
  daily_income_cny: number;
  daily_income_ashva: number;
  flow_gb: number;
  fine_cny: number;
  fine_ashva: number;
  net_income_ashva: number;
  ashva_price_usd: number | null;
}

interface EarningsData {
  device_id: string;
  wallet_address: string | null;
  total_earnings_cny: number;
  total_earnings_ashva: number;
  avg_daily_cny: number;
  avg_daily_ashva: number;
  days_count: number;
  daily_records: DailyEarning[];
}

interface DeviceEarningsHistoryProps {
  deviceId: string;
}

export function DeviceEarningsHistory({ deviceId }: DeviceEarningsHistoryProps) {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarningsData();
  }, [deviceId, timeRange]);

  const fetchEarningsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/devices/${deviceId}/earnings?days=${timeRange}`);
      if (!response.ok) {
        throw new Error('获取收入数据失败');
      }
      const data = await response.json();
      setEarningsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !earningsData) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600">加载失败</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error || '没有收入数据'}</p>
          <Button onClick={fetchEarningsData} className="mt-4">重试</Button>
        </CardContent>
      </Card>
    );
  }

  const chartData = [...earningsData.daily_records].reverse().map(record => ({
    date: record.income_date.slice(5),
    fullDate: record.income_date,
    CNY: record.daily_income_cny,
    ASHVA: record.daily_income_ashva,
    流量GB: record.flow_gb,
  }));

  const recentRecords = earningsData.daily_records.slice(0, 7);
  const olderRecords = earningsData.daily_records.slice(7, 14);
  const recentAvg = recentRecords.reduce((sum, r) => sum + r.daily_income_cny, 0) / recentRecords.length;
  const olderAvg = olderRecords.length > 0 
    ? olderRecords.reduce((sum, r) => sum + r.daily_income_cny, 0) / olderRecords.length 
    : recentAvg;
  const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100) : 0;
  const isPositiveTrend = trendPercentage >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">收入历史</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择时间范围" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">最近 7 天</SelectItem>
            <SelectItem value="30">最近 30 天</SelectItem>
            <SelectItem value="90">最近 90 天</SelectItem>
            <SelectItem value="180">最近 180 天</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入 (CNY)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{earningsData.total_earnings_cny.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {earningsData.days_count} 天记录
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入 (ASHVA)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earningsData.total_earnings_ashva.toFixed(4)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">日均收入 (CNY)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{earningsData.avg_daily_cny.toFixed(2)}</div>
            <div className={`flex items-center text-xs mt-1 ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveTrend ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              <span>{Math.abs(trendPercentage).toFixed(1)}% vs 上周</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">日均收入 (ASHVA)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earningsData.avg_daily_ashva.toFixed(4)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>收入趋势</CardTitle>
          <CardDescription>显示最近 {timeRange} 天的每日收入变化</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCNY" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorASHVA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="CNY" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCNY)" name="CNY 收入" />
              <Area yAxisId="right" type="monotone" dataKey="ASHVA" stroke="#10b981" fillOpacity={1} fill="url(#colorASHVA)" name="ASHVA 收入" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>每日明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">日期</th>
                  <th className="text-right p-2">CNY 收入</th>
                  <th className="text-right p-2">ASHVA 收入</th>
                  <th className="text-right p-2">流量 (GB)</th>
                  <th className="text-right p-2">罚款 (CNY)</th>
                  <th className="text-right p-2">净收入 (ASHVA)</th>
                </tr>
              </thead>
              <tbody>
                {earningsData.daily_records.map((record) => (
                  <tr key={record.income_date} className="border-b hover:bg-gray-50">
                    <td className="p-2">{record.income_date}</td>
                    <td className="text-right p-2">¥{record.daily_income_cny.toFixed(2)}</td>
                    <td className="text-right p-2">{record.daily_income_ashva.toFixed(4)}</td>
                    <td className="text-right p-2">{record.flow_gb.toFixed(2)}</td>
                    <td className="text-right p-2 text-red-600">
                      {record.fine_cny > 0 ? `-¥${record.fine_cny.toFixed(2)}` : '-'}
                    </td>
                    <td className="text-right p-2 font-semibold">
                      {record.net_income_ashva.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
