import { NextRequest, NextResponse } from 'next/server';

const AGENT_API_URL = 'http://108.165.176.77:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/stats/agents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return NextResponse.json({
      success: false,
      error: '无法连接到 Agent 服务器',
      total_machines: 0,
      online_machines: 0,
      total_tasks: 0,
      running_tasks: 0,
      successful_tasks: 0,
      success_rate: 0,
      avg_response_time: 0
    }, { status: 500 });
  }
}
