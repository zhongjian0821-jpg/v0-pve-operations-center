import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, verifyUserToken } from './auth';

export function successResponse(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message
  });
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({
    success: false,
    error: message
  }, { status });
}

export function getAdminFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyAdminToken(token);
}

export function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyUserToken(token);
}

export function requireAdmin(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    throw new Error('Unauthorized');
  }
  return admin;
}

export function requireUser(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
