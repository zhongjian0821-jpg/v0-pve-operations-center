import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
      const record = await sql`SELECT * FROM devices WHERE id = ${id}`;
      return successResponse(record[0] || null);
    }
    
    const records = await sql`SELECT * FROM devices ORDER BY created_at DESC`;
    return successResponse({ records, total: records.length });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { wallet_address, device_id, device_type, status = "active" } = body;
    
    if (!wallet_address || !device_id) {
      return errorResponse("wallet_address and device_id are required", 400);
    }
    
    const result = await sql`
      INSERT INTO devices (
        wallet_address, device_id, device_type, status, created_at, updated_at
      ) VALUES (
        ${wallet_address}, ${device_id}, ${device_type}, ${status}, NOW(), NOW()
      ) RETURNING *
    `;
    return successResponse(result[0], 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

}

}
