import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createClient } from '@/lib/supabase/server';
import { syncCompanionEmbedding } from '@/lib/embeddings';
import { z } from 'zod';

const onboardingSchema = z.object({
  cities: z.array(z.string()).min(1),
  baseCity: z.string(),
  interests: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  hourlyRateMXN: z.number().int().min(100),
  hasVehicle: z.boolean(),
  vehicleType: z.string().optional(),
  bio: z.string().max(2000).optional(),
  languages: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = onboardingSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (!user || user.role !== 'COMPANION') {
      return NextResponse.json({ error: 'Solo los acompañantes pueden completar este onboarding' }, { status: 403 });
    }

    const companion = await prisma.companionProfile.update({
      where: { userId: authUser.id },
      data: {
        cities: payload.cities,
        baseCity: payload.baseCity,
        interests: payload.interests,
        certifications: payload.certifications,
        hourlyRateMXN: payload.hourlyRateMXN,
        hasVehicle: payload.hasVehicle,
        vehicleType: payload.vehicleType ?? null,
        bio: payload.bio ?? null,
        isActive: true,
      },
    });

    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        languages: payload.languages,
        languageMain: payload.languages[0],
      },
    });

    syncCompanionEmbedding(companion.id).catch((error) => {
      console.warn('Failed to refresh companion embedding:', error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Companion onboarding error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
