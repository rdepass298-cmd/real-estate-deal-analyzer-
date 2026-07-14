import { NextResponse } from 'next/server';
import { getPaidStatusFromAccessToken, getPaidStatusFromServerCookies } from '@/lib/server/authz';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const status = token
      ? await getPaidStatusFromAccessToken(token)
      : await getPaidStatusFromServerCookies();

    console.log('[api/pro/status] resolved user', {
      userId: status.userId,
      isAuthenticated: status.isAuthenticated,
      isPaid: status.isPaid,
      usedAccessToken: Boolean(token),
    });

    if (!status.isAuthenticated) {
      return NextResponse.json({ isPaid: false, isAuthenticated: false }, { status: 200 });
    }

    return NextResponse.json({ isPaid: status.isPaid, isAuthenticated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    const stack = error instanceof Error ? error.stack : undefined;
    const authHeader = req.headers.get('authorization');

    console.error('[api/pro/status] Failed to resolve paid status', {
      message,
      stack,
      hasAuthorizationHeader: Boolean(authHeader),
      cookieHeaderPresent: Boolean(req.headers.get('cookie')),
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
