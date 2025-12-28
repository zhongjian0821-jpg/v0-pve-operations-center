import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const orders = await sql`
      SELECT * FROM orders 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = await sql`SELECT COUNT(*) as count FROM orders`;

    return successResponse({
      orders,
      pagination: {
        page,
        limit,
        total: Number(total[0].count)
      }
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    
    return successResponse({
      message: '订单创建功能待实现',
      data: body
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return errorResponse('ID is required', 400);
    }
    
    return successResponse({
      message: '订单更新功能待实现',
      id
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return errorResponse('ID is required', 400);
    }
    
    const result = await sql`
      DELETE FROM orders
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return errorResponse('Order not found', 404);
    }
    
    return successResponse({
      message: 'Deleted successfully',
      id: result[0].id
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
