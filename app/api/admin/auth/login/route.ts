import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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

    const [admins] = await db.query(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );

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
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
