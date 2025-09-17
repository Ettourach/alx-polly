
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = registerSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid input', details: parse.error.errors }, { status: 400 });
    }
    const { name, email, password } = parse.data;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Registration failed' }, { status: 400 });
    }
    // Only include minimal user info in JWT
    const token = jwt.sign({ id: data.user.id, email: data.user.email, name }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    return NextResponse.json({ user: { id: data.user.id, email: data.user.email, name }, token });
  } catch (err) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
