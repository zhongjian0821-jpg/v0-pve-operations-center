// app/api/linghan/proxy/route.ts
// 灵瀚云API代理 - 解决前端CORS问题

import { NextRequest, NextResponse } from 'next/server';

const LINGHAN_CONFIG = {
  baseUrl: 'https://lhy.linghanyun.com/oemApi/faDev/common',
  ak: 'cb4e1cc5599d433896bfeb0c94995780',
  as: '37f005ebee964853ae6dc96f8ca28792'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, method = 'GET', data } = body;

    if (!endpoint) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少endpoint参数' 
      }, { status: 400 });
    }

    const url = `${LINGHAN_CONFIG.baseUrl}${endpoint}`;
    
    console.log('代理请求灵瀚云API:', url);
    console.log('请求方法:', method);
    console.log('请求数据:', data);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ak': LINGHAN_CONFIG.ak,
      'as': LINGHAN_CONFIG.as
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    console.log('灵瀚云API响应:', result);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('代理API错误:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// 支持GET方法用于简单查询
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少endpoint参数' 
      }, { status: 400 });
    }

    const url = `${LINGHAN_CONFIG.baseUrl}${endpoint}`;
    
    console.log('代理GET请求:', url);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ak': LINGHAN_CONFIG.ak,
      'as': LINGHAN_CONFIG.as
    };

    const response = await fetch(url, { headers });
    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('代理API错误:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
