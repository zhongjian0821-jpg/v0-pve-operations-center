'use client';

import { useEffect, useState } from 'react';

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/system-logs')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogs(data.data || []);
        } else {
          setError(data.error || 'Failed to load logs');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (error) return <div className="p-8"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div></div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">系统日志</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">日志记录 ({logs.length})</h2>
        </div>
        <div className="p-6 space-y-3">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500">暂无日志</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-blue-600">{log.event_type || 'INFO'}</span>
                  <span className="text-sm text-gray-500">{new Date(log.created_at).toLocaleString('zh-CN')}</span>
                </div>
                <p className="text-gray-700">{log.message || log.error_message || 'No message'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
