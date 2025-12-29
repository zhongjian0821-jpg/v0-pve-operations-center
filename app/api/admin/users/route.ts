import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
      const record = await sql`SELECT * FROM users WHERE id = ${id}`;
      return successResponse(record[0] || null);
    }
    
    const records = await sql`SELECT * FROM users ORDER BY created_at DESC`;
    return successResponse({ records, total: records.length });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { wallet_address, username, email, role = "user" } = body;
    
    if (!wallet_address) {
      return errorResponse("wallet_address is required", 400);
    }
    
    const result = await sql`
      INSERT INTO users (
        wallet_address, username, email, role, created_at, updated_at
      ) VALUES (
        ${wallet_address}, ${username}, ${email}, ${role}, NOW(), NOW()
      ) RETURNING *
    `;
    return successResponse(result[0], 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

}

}
