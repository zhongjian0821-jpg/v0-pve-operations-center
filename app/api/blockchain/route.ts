import { NextRequest, NextResponse } from 'next/server';

// 后端 API服务器地址
const BACKEND_URL = 'http://108.165.176.77:3001';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || '/api/admin/nodes/list';
  
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || 'Bearer test-token',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { endpoint, ...data } = body;
  
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || 'Bearer test-token',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
