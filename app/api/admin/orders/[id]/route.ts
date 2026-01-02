// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// DELETE - 删除订单
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: '无效的订单ID' },
        { status: 400 }
      );
    }
    
    // 删除订单记录（从 nodes 表）
    const result = await sql`
      DELETE FROM nodes 
      WHERE id = ${orderId}
      RETURNING id, node_id
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: '订单不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '订单删除成功',
      data: {
        id: result[0].id,
        node_id: result[0].node_id
      }
    });
    
  } catch (error: any) {
    console.error('删除订单失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '删除订单失败',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
