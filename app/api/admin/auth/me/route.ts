import { NextRequest } from 'next/server';
import { requireAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    return successResponse({ admin });
  } catch (error: any) {
    return errorResponse(error.message, 401);
  }
}
