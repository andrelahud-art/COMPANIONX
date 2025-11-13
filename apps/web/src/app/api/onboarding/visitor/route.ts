import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createClient } from '@/lib/supabase/server';
import { syncVisitorEmbedding } from '@/lib/embeddings';
import { z } from 'zod';

const onboardingSchema = z.object({
  fifaCities: z.array(z.string()).min(1),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  interests: z.array(z.string()).default([]),
  budgetMXN: z.number().int().optional(),
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

    if (!user || user.role !== 'VISITOR') {
      return NextResponse.json({ error: 'Solo los visitantes pueden completar este onboarding' }, { status: 403 });
    }

    const visitorProfile = await prisma.visitorProfile.update({
      where: { userId: authUser.id },
      data: {
        fifaCities: payload.fifaCities,
        arrivalDate: payload.arrivalDate ? new Date(payload.arrivalDate) : null,
        departureDate: payload.departureDate ? new Date(payload.departureDate) : null,
        interests: payload.interests,
        budgetMXN: payload.budgetMXN ?? null,
        preferredLanguages: payload.languages,
      },
    });

    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        languages: payload.languages,
        languageMain: payload.languages[0],
      },
    });

    syncVisitorEmbedding(visitorProfile.id).catch((error) => {
      console.warn('Failed to refresh visitor embedding:', error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Visitor onboarding error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
