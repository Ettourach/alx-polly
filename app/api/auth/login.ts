import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = loginSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid input', details: parse.error.errors }, { status: 400 });
    }
    const { email, password } = parse.data;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 401 });
    }
    // Only include minimal user info in JWT
    const token = jwt.sign({ id: data.user.id, email: data.user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    return NextResponse.json({ user: { id: data.user.id, email: data.user.email }, token });
  } catch (err) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
