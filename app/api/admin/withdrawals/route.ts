import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    
    if (id) {
      const record = await sql`SELECT * FROM withdrawals WHERE id = ${id}`;
      return successResponse(record[0] || null);
    }
    
    let query = sql`SELECT * FROM withdrawals WHERE 1=1`;
    if (status) {
      query = sql`${query} AND status = ${status}`;
    }
    query = sql`${query} ORDER BY created_at DESC`;
    
    const records = await query;
    return successResponse({ records, total: records.length });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { wallet_address, amount, status = "pending" } = body;
    
    if (!wallet_address || !amount) {
      return errorResponse("wallet_address and amount are required", 400);
    }
    
    const result = await sql`
      INSERT INTO withdrawals (
        wallet_address, amount, status, created_at, updated_at
      ) VALUES (
        ${wallet_address}, ${amount}, ${status}, NOW(), NOW()
      ) RETURNING *
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
    const { id, status } = body;
    
    if (!id || !status) {
      return errorResponse("id and status are required", 400);
    }
    
    const result = await sql`
      UPDATE withdrawals 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) return errorResponse("Record not found", 404);
    return successResponse(result[0]);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return errorResponse("id is required", 400);
    
    const result = await sql`DELETE FROM withdrawals WHERE id = ${id} RETURNING *`;
    if (result.length === 0) return errorResponse("Record not found", 404);
    
    return successResponse({ message: "Withdrawal deleted successfully", deleted: result[0] });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
