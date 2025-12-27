import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { comparePassword, generateAdminToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const admins = await sql`
      SELECT * FROM admins WHERE username = ${username} LIMIT 1
    `;

    if (admins.length === 0) {
      return errorResponse('Invalid credentials', 401);
    }

    const admin = admins[0];
    const isValid = await comparePassword(password, admin.password_hash);

    if (!isValid) {
      return errorResponse('Invalid credentials', 401);
    }

    const token = generateAdminToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role
    });

    return successResponse({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
