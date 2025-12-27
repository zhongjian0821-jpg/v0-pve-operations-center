import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // 检查是否已有管理员
    const existingAdmins = await sql`SELECT COUNT(*) as count FROM admins`;
    
    if (Number(existingAdmins[0].count) > 0) {
      return errorResponse('Admin already exists', 400);
    }

    // 创建默认管理员
    const passwordHash = await hashPassword('Admin123!');
    
    const result = await sql`
      INSERT INTO admins (username, password_hash, role)
      VALUES ('admin', ${passwordHash}, 'super_admin')
      RETURNING id, username, role
    `;

    return successResponse({
      message: 'Admin created successfully',
      admin: result[0]
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const admins = await sql`
      SELECT id, username, role, created_at FROM admins
    `;

    return successResponse({ 
      count: admins.length,
      admins: admins.map(a => ({
        id: a.id,
        username: a.username,
        role: a.role,
        created_at: a.created_at
      }))
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
