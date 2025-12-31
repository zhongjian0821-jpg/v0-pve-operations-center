import { NextRequest, NextResponse } from 'next/server';

const N8N_BASE_URL = 'https://ashvacoin.com/webhook';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    let endpoint = '';
    
    switch (action) {
      case 'deploy':
        endpoint = `${N8N_BASE_URL}/deploy-node`;
        break;
      case 'start':
        endpoint = `${N8N_BASE_URL}/start-node`;
        break;
      case 'stop':
        endpoint = `${N8N_BASE_URL}/stop-node`;
        break;
      case 'delete':
        endpoint = `${N8N_BASE_URL}/delete-node`;
        break;
      case 'logs':
        endpoint = `${N8N_BASE_URL}/node-logs`;
        break;
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const response = await fetch(`${N8N_BASE_URL}/list-nodes`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
