// app/api/test-count/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const total = await sql`SELECT COUNT(*) as count FROM bl_blockchain_nodes`;
    const linghan = await sql`SELECT COUNT(*) as count FROM bl_blockchain_nodes WHERE node_type = 'linghan'`;
    const running = await sql`SELECT COUNT(*) as count FROM bl_blockchain_nodes WHERE status = 'running'`;
    
    return NextResponse.json({
      success: true,
      data: {
        total: parseInt(total[0].count),
        linghan: parseInt(linghan[0].count),
        running: parseInt(running[0].count)
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
