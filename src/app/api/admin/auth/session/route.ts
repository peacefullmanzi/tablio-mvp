import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-security';

export async function GET(request: Request) {
  try {
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;

    return NextResponse.json({ 
      success: true, 
      restaurantId: auth.restaurantId,
      role: auth.role
    });
  } catch (error: unknown) {
    console.error('[SessionAuth] Error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
