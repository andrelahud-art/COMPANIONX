import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
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

  await supabase.auth.signOut();

  return new NextResponse(null, { status: 204, headers: responseHeaders });
}
