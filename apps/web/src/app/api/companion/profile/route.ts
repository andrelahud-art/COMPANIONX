import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateProfileSchema = z.object({
  cities: z.array(z.string()).min(1),
  interests: z.array(z.string()).min(1),
  spokenLanguages: z.array(z.string()).min(1),
  hourlyRateMXN: z.number().min(100),
  bio: z.string().min(10),
});

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // Check if user is a companion
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { companion: true },
    });

    if (!dbUser || dbUser.role !== 'COMPANION') {
      return NextResponse.json({ error: 'User is not a companion' }, { status: 403 });
    }

    // Update companion profile
    const companionProfile = await prisma.companionProfile.update({
      where: { userId: user.id },
      data: {
        cities: data.cities,
        interests: data.interests,
        hourlyRateMXN: data.hourlyRateMXN,
        bio: data.bio,
        isActive: true, // Activate profile after onboarding
      },
    });

    // Update user languages
    await prisma.user.update({
      where: { id: user.id },
      data: {
        languages: data.spokenLanguages,
        languageMain: data.spokenLanguages[0],
      },
    });

    return NextResponse.json({
      success: true,
      profile: companionProfile,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companionProfile = await prisma.companionProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
            rating: true,
            ratingsCount: true,
            languages: true,
          },
        },
      },
    });

    if (!companionProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: companionProfile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
