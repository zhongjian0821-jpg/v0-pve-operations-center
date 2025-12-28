import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

// GET - 获取交易记录
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    let query = `SELECT * FROM transactions WHERE 1=1`;
    const params: any[] = [];
    
    if (walletAddress) {
      params.push(walletAddress);
      query += ` AND wallet_address = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    if (type) {
      params.push(type);
      query += ` AND transaction_type = $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const records = await sql.unsafe(query, params);
    
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST - 创建交易记录
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const {
      wallet_address,
      transaction_type,
      amount,
      status = 'pending',
      tx_hash,
      from_address,
      to_address,
      description
    } = body;
    
    if (!wallet_address || !transaction_type || !amount) {
      return errorResponse('wallet_address, transaction_type, and amount are required', 400);
    }
    
    const result = await sql`
      INSERT INTO transactions (
        wallet_address, transaction_type, amount, status,
        tx_hash, from_address, to_address, description
      )
      VALUES (
        ${wallet_address}, ${transaction_type}, ${amount}, ${status},
        ${tx_hash}, ${from_address}, ${to_address}, ${description}
      )
      RETURNING *
    `;
    
    return successResponse(result[0], 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT - 更新交易状态
export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { id, status, tx_hash } = body;
    
    if (!id) {
      return errorResponse('ID is required', 400);
    }
    
    const result = await sql`
      UPDATE transactions
      SET 
        status = COALESCE(${status}, status),
        tx_hash = COALESCE(${tx_hash}, tx_hash),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return errorResponse('Transaction not found', 404);
    }
    
    return successResponse(result[0]);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
