import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { serialize } from 'cookie';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const { email, password } = loginSchema.parse(await request.json());

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables are not configured');
    }

    const responseHeaders = new Headers();

    const supabase = createServerClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            responseHeaders.append('set-cookie', serialize(name, value, options));
          },
          remove(name: string, options: CookieOptions) {
            responseHeaders.append('set-cookie', serialize(name, '', { ...options, maxAge: 0 }));
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? 'Invalid credentials' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isBanned: true,
      },
    });

    if (!user || !user.isActive || user.isBanned) {
      return NextResponse.json({ error: 'Account disabled' }, { status: 403, headers: responseHeaders });
    }

    return new NextResponse(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        session: {
          accessToken: data.session?.access_token ?? null,
          refreshToken: data.session?.refresh_token ?? null,
          expiresAt: data.session?.expires_at ?? null,
        },
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
