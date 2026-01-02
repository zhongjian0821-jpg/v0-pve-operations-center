// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // 直接查询数据库
    const result = await sql`
      SELECT id, task_name, node_type, created_at 
      FROM bl_blockchain_nodes 
      ORDER BY id DESC 
      LIMIT 10
    `;
    
    return NextResponse.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
