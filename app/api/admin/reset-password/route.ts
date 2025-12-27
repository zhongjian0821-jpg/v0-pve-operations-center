import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const { username, newPassword } = await request.json();
    
    if (!username || !newPassword) {
      return errorResponse('Username and newPassword required', 400);
    }

    const passwordHash = await hashPassword(newPassword);
    
    const result = await sql`
      UPDATE admins 
      SET password_hash = ${passwordHash}
      WHERE username = ${username}
      RETURNING id, username, role
    `;

    if (result.length === 0) {
      return errorResponse('Admin not found', 404);
    }

    return successResponse({
      message: 'Password reset successfully',
      admin: result[0]
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
