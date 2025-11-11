import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['VISITOR', 'COMPANION']),
  languageMain: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const supabase = createServiceClient();

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 400 });
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
        languageMain: data.languageMain,
        country: data.country,
        languages: data.languageMain ? [data.languageMain] : [],
      },
    });

    // Create role-specific profile
    if (data.role === 'COMPANION') {
      await prisma.companionProfile.create({
        data: {
          userId: user.id,
          cities: [],
          interests: [],
          certifications: [],
          hourlyRateMXN: 300, // Default
          isActive: false, // Needs to complete onboarding
        },
      });
    } else {
      await prisma.visitorProfile.create({
        data: {
          userId: user.id,
          fifaCities: [],
          interests: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
