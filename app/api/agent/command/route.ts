import { NextRequest, NextResponse } from 'next/server';

const AGENT_API_URL = 'http://108.165.176.77:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { machine_code, command } = body;

    if (!machine_code || !command) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    const response = await fetch(`${AGENT_API_URL}/api/command/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        machine_code,
        command,
        timeout: 60
      })
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      task_id: data.task_id,
      message: '命令已发送'
    });
  } catch (error) {
    console.error('发送命令失败:', error);
    return NextResponse.json({
      success: false,
      error: '无法连接到 Agent 服务器'
    }, { status: 500 });
  }
}
