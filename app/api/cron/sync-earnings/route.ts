import { NextResponse } from 'next/server';

// Vercel Cron Job - 每天凌晨2点自动运行
export async function GET(request: Request) {
  // 验证Cron Secret (防止未授权访问)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('[Cron] 未授权访问');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[Cron] 开始执行定时同步任务');
  
  try {
    // 调用批量同步API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://789.ashvacoin.org';
    const response = await fetch(`${baseUrl}/api/admin/linghan/sync-all-earnings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('[Cron] 同步结果:', result);
    
    return NextResponse.json({
      cron_executed: true,
      timestamp: new Date().toISOString(),
      sync_result: result
    });
  } catch (error) {
    console.error('[Cron] 执行失败:', error);
    return NextResponse.json(
      { 
        cron_executed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
