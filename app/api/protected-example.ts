import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './auth/jwt-middleware';

export async function GET(req: NextRequest) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // You can now use user.id, user.email, etc. from the JWT
  return NextResponse.json({ message: 'This is a protected route!', user });
}
