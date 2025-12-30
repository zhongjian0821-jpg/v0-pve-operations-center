
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminNodesPage() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/cloud-nodes')
      .then(res => res.json())
      .then(data => {
        if (data.success) setNodes(data.data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">节点管理</h1>
      <Card>
        <CardHeader><CardTitle>全部节点</CardTitle></CardHeader>
        <CardContent>
          {loading ? '加载中...' : (
            <table className="w-full">
              <thead><tr className="border-b">
                <th className="text-left p-4">节点ID</th>
                <th className="text-left p-4">类型</th>
                <th className="text-center p-4">状态</th>
                <th className="text-right p-4">收益</th>
              </tr></thead>
              <tbody>
                {nodes.map((node: any) => (
                  <tr key={node.node_id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">{node.node_id}</td>
                    <td className="p-4">{node.node_type}</td>
                    <td className="text-center p-4">
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-sm">
                        {node.status}
                      </span>
                    </td>
                    <td className="text-right p-4">${node.total_earnings?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
