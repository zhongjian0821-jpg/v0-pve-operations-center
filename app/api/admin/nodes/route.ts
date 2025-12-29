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

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) return errorResponse("id is required", 400);
    
    const fields = ["node_type", "status", "cpu_cores", "memory_gb", "storage_gb", "uptime_percentage"];
    const updates: string[] = [];
    const values: any[] = [];
    
    fields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(field);
        values.push(updateData[field]);
      }
    });
    
    if (updates.length === 0) return errorResponse("No fields to update", 400);
    
    const setClause = updates.map((f, i) => `${f} = $${i + 1}`).join(", ");
    values.push(id);
    
    const result = await sql.query(
      `UPDATE nodes SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) return errorResponse("Record not found", 404);
    return successResponse(result.rows[0]);
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
    
    const result = await sql`DELETE FROM nodes WHERE id = ${id} RETURNING *`;
    if (result.length === 0) return errorResponse("Record not found", 404);
    
    return successResponse({ message: "Node deleted successfully", deleted: result[0] });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
