
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/transfer/marketplace')
      .then(res => res.json())
      .then(data => {
        if (data.success) setListings(data.data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">转让市场</h1>
      <Card>
        <CardHeader><CardTitle>可购买节点</CardTitle></CardHeader>
        <CardContent>
          {loading ? '加载中...' : listings.length === 0 ? '暂无在售节点' : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing: any) => (
                <Card key={listing.id}>
                  <CardContent className="pt-6">
                    <h3 className="font-bold">{listing.node_type}</h3>
                    <p className="text-2xl font-bold my-2">\${listing.price}</p>
                    <button className="w-full bg-blue-500 text-white px-4 py-2 rounded">
                      购买
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
