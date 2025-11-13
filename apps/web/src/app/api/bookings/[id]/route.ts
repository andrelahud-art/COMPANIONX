import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']),
  reason: z.string().max(2000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        visitor: { select: { id: true } },
        companion: { select: { id: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isVisitor = booking.visitorId === authUser.id;
    const isCompanion = booking.companionId === authUser.id;

    if (!isVisitor && !isCompanion) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    switch (data.status) {
      case 'PAID':
        if (!isVisitor) {
          return NextResponse.json({ error: 'Only the visitor can confirm payment' }, { status: 403 });
        }
        if (booking.status !== 'PENDING') {
          return NextResponse.json({ error: 'Booking already processed' }, { status: 400 });
        }
        break;
      case 'IN_PROGRESS':
        if (!isCompanion) {
          return NextResponse.json({ error: 'Only the companion can start the experience' }, { status: 403 });
        }
        if (!['PAID', 'PENDING'].includes(booking.status)) {
          return NextResponse.json({ error: 'Invalid transition' }, { status: 400 });
        }
        break;
      case 'COMPLETED':
        if (!isCompanion) {
          return NextResponse.json({ error: 'Only the companion can complete the booking' }, { status: 403 });
        }
        if (booking.status !== 'IN_PROGRESS') {
          return NextResponse.json({ error: 'Booking must be in progress before completion' }, { status: 400 });
        }
        break;
      case 'CANCELED':
        if (!['PENDING', 'PAID', 'IN_PROGRESS'].includes(booking.status)) {
          return NextResponse.json({ error: 'Booking can no longer be canceled' }, { status: 400 });
        }
        if (!(isVisitor || isCompanion)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        break;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = { status: data.status };

      if (data.status === 'PAID') {
        updateData.confirmedAt = new Date();
      }

      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }

      if (data.status === 'CANCELED') {
        updateData.canceledAt = new Date();
        updateData.cancellationReason = data.reason ?? null;
      }

      const result = await tx.booking.update({
        where: { id },
        data: updateData,
      });

      if (data.status === 'CANCELED') {
        await tx.availability.updateMany({
          where: {
            companion: { userId: booking.companionId },
            from: { lte: booking.from },
            to: { gte: booking.to },
            isBooked: true,
          },
          data: { isBooked: false },
        });
      }

      return result;
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error('Update booking error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
