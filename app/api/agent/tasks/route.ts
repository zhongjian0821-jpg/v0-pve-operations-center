import { NextRequest, NextResponse } from 'next/server';

const AGENT_API_URL = 'http://108.165.176.77:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/tasks/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      tasks: data.tasks || [],
      total: data.tasks?.length || 0
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '无法连接到 Agent 服务器',
      tasks: []
    }, { status: 500 });
  }
}
