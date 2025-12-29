import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
      const record = await sql`SELECT * FROM nodes WHERE id = ${id}`;
      return successResponse(record[0] || null);
    }
    
    const records = await sql`SELECT * FROM nodes ORDER BY created_at DESC`;
    return successResponse({ records, total: records.length });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { wallet_address, node_type, status = "pending", cpu_cores, memory_gb, storage_gb } = body;
    
    if (!wallet_address || !node_type) {
      return errorResponse("wallet_address and node_type are required", 400);
    }
    
    const result = await sql`
      INSERT INTO nodes (
        wallet_address, node_type, status, cpu_cores, memory_gb, storage_gb, created_at, updated_at
      ) VALUES (
        ${wallet_address}, ${node_type}, ${status}, ${cpu_cores}, ${memory_gb}, ${storage_gb}, NOW(), NOW()
      ) RETURNING *
    `;
    return successResponse(result[0], 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

}

}
