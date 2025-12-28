import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { comparePassword } from '@/lib/password';
import { generateAdminToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // 使用 PostgreSQL 的 sql 模板标签
    const admins = await sql`
      SELECT * FROM admins WHERE username = ${username}
    `;

    if (!Array.isArray(admins) || admins.length === 0) {
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const admin = admins[0] as any;
    const isValidPassword = await comparePassword(password, admin.password_hash);

    if (!isValidPassword) {
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateAdminToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      wallet_address: admin.wallet_address || ''
    });

    return Response.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          email: admin.email
        }
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
