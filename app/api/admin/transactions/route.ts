import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    let records;
    
    if (walletAddress && status && type) {
      records = await sql`
        SELECT * FROM transactions 
        WHERE wallet_address = ${walletAddress} 
        AND status = ${status} 
        AND transaction_type = ${type}
        ORDER BY created_at DESC
      `;
    } else if (walletAddress && status) {
      records = await sql`
        SELECT * FROM transactions 
        WHERE wallet_address = ${walletAddress} 
        AND status = ${status}
        ORDER BY created_at DESC
      `;
    } else if (walletAddress) {
      records = await sql`
        SELECT * FROM transactions 
        WHERE wallet_address = ${walletAddress}
        ORDER BY created_at DESC
      `;
    } else if (status) {
      records = await sql`
        SELECT * FROM transactions 
        WHERE status = ${status}
        ORDER BY created_at DESC
      `;
    } else {
      records = await sql`SELECT * FROM transactions ORDER BY created_at DESC`;
    }
    
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

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
    
    return successResponse(result[0]);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

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
