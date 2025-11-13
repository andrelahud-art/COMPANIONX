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

    const from = new Date(data.from);
    const to = new Date(data.to);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
    }

    // Get companion profile
    const companion = await prisma.companionProfile.findUnique({
      where: { id: data.companionId },
      include: { user: true },
    });

    if (!companion || !companion.isActive || companion.user.isBanned) {
      return NextResponse.json({ error: 'Companion not found or inactive' }, { status: 404 });
    }

    if (companion.userId === authUser.id) {
      return NextResponse.json({ error: 'Cannot book yourself' }, { status: 400 });
    }

    const durationHours = calculateDurationHours(from, to);
    if (durationHours <= 0) {
      return NextResponse.json({ error: 'Duration must be greater than zero' }, { status: 400 });
    }

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

    try {
      const result = await prisma.$transaction(async (tx) => {
        const conflicting = await tx.booking.count({
          where: {
            OR: [
              { visitorId: authUser.id },
              { companionId: companion.userId },
            ],
            status: { in: ['PENDING', 'PAID', 'IN_PROGRESS'] },
            AND: [{ from: { lt: to } }, { to: { gt: from } }],
          },
        });

        if (conflicting > 0) {
          throw new Error('CONFLICT');
        }

        const availabilitySlot = await tx.availability.findFirst({
          where: {
            companionId: companion.id,
            isBooked: false,
            from: { lte: from },
            to: { gte: to },
          },
        });

        if (!availabilitySlot) {
          throw new Error('NO_AVAILABILITY');
        }

        const booking = await tx.booking.create({
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

        await tx.availability.update({
          where: { id: availabilitySlot.id },
          data: { isBooked: true },
        });

        return booking;
      });

      return NextResponse.json({
        success: true,
        booking: {
          id: result.id,
          companionId: result.companionId,
          city: result.city,
          from: result.from,
          to: result.to,
          durationHours: result.durationHours,
          priceMXN: result.priceMXN,
          platformFeeMXN: result.platformFeeMXN,
          status: result.status,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'NO_AVAILABILITY') {
          return NextResponse.json({ error: 'Companion is not available for that time window' }, { status: 409 });
        }
        if (error.message === 'CONFLICT') {
          return NextResponse.json({ error: 'Schedule conflict detected' }, { status: 409 });
        }
      }

      throw error;
    }
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
