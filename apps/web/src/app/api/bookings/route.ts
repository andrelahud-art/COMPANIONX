import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createClient } from '@/lib/supabase/server';
import { calculatePlatformFee, calculateCompanionPayout } from '@/lib/stripe';
import { calculateDurationHours } from '@/lib/utils';
import { z } from 'zod';

const createBookingSchema = z.object({
  companionId: z.string(),
  city: z.string(),
  from: z.string(), // ISO date string
  to: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createBookingSchema.parse(body);

    // Get companion profile
    const companion = await prisma.companionProfile.findUnique({
      where: { id: data.companionId },
      include: { user: true },
    });

    if (!companion || !companion.isActive) {
      return NextResponse.json({ error: 'Companion not found or inactive' }, { status: 404 });
    }

    // Calculate pricing
    const from = new Date(data.from);
    const to = new Date(data.to);
    const durationHours = calculateDurationHours(from, to);

    let priceMXN: number;

    // Use block pricing if available
    if (durationHours >= 12 && companion.block12hRateMXN) {
      priceMXN = companion.block12hRateMXN;
    } else if (durationHours >= 6 && companion.block6hRateMXN) {
      priceMXN = companion.block6hRateMXN;
    } else if (durationHours >= 3 && companion.block3hRateMXN) {
      priceMXN = companion.block3hRateMXN;
    } else {
      priceMXN = Math.round(companion.hourlyRateMXN * durationHours);
    }

    const platformFeeMXN = calculatePlatformFee(priceMXN);
    const companionPayoutMXN = calculateCompanionPayout(priceMXN);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        visitorId: authUser.id,
        companionId: companion.userId,
        city: data.city,
        from,
        to,
        durationHours,
        priceMXN,
        platformFeeMXN,
        companionPayoutMXN,
        notes: data.notes,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        companionId: booking.companionId,
        city: booking.city,
        from: booking.from,
        to: booking.to,
        durationHours: booking.durationHours,
        priceMXN: booking.priceMXN,
        platformFeeMXN: booking.platformFeeMXN,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Create booking error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch bookings based on role
    const where = user.role === 'VISITOR'
      ? { visitorId: authUser.id }
      : { companionId: authUser.id };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        visitor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        companion: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
