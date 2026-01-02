// app/api/linghan/getDevListInfo/route.ts
// 灵瀚云API代理 - 获取设备列表信息

import { NextRequest, NextResponse } from 'next/server';

const LINGHAN_API_BASE = 'https://api.ashvacoin.org/api/linghan';
const LINGHAN_TOKEN = 'sk-T3U5RHxJ18D16D07A6EcFcB41e9547AeA3F6B5E4Ca4b1218';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const devIds = body.devIds || [];
    
    if (!Array.isArray(devIds) || devIds.length === 0) {
      return NextResponse.json({
        code: 400,
        message: '请提供设备ID列表',
        data: []
      });
    }
    
    // 调用灵瀚云API
    const response = await fetch(`${LINGHAN_API_BASE}/getDevListInfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINGHAN_TOKEN}`
      },
      body: JSON.stringify({ devIds })
    });
    
    const result = await response.json();
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('灵瀚云API调用失败:', error);
    return NextResponse.json({
      code: 500,
      message: error.message || '调用失败',
      data: []
    }, { status: 500 });
  }
}
