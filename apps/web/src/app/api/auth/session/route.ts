import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { serialize } from 'cookie';

export async function GET(request: NextRequest) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
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

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return new NextResponse(JSON.stringify({ user: null }), {
      status: 200,
      headers: responseHeaders,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      languages: true,
    },
  });

  if (!user) {
    return new NextResponse(JSON.stringify({ user: null }), {
      status: 200,
      headers: responseHeaders,
    });
  }

  return new NextResponse(JSON.stringify({ user }), {
    status: 200,
    headers: responseHeaders,
  });
}
