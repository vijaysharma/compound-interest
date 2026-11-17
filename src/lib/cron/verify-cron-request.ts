import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
export function isCronAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('CRON_SECRET is not configured in environment variables.');
    return false;
  }
  const authHeader = request.headers.get('authorization') ?? '';
  // The expected token is 'Bearer <CRON_SECRET>'
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authHeader);
  // Perform a timing-safe comparison to prevent timing attacks
  if (expected.length !== received.length) {
    return false;
  }
  return timingSafeEqual(expected, received);
}
// Middleware to protect cron routes
export function withCronAuth(handler: (request: Request) => Promise<NextResponse>): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    if (!isCronAuthorised(request)) {
      return NextResponse.json({ error: 'Unauthorised: Invalid or missing CRON_SECRET' }, { status: 401 });
    }
    return handler(request);
  };
}
