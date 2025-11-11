import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const createIntentSchema = z.object({
  bookingId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createIntentSchema.parse(body);

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        visitor: true,
        companion: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.visitorId !== authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Booking already processed' }, { status: 400 });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.priceMXN * 100, // Convert to cents
      currency: 'mxn',
      metadata: {
        bookingId: booking.id,
        visitorId: booking.visitorId,
        companionId: booking.companionId,
      },
      description: `CompanionX booking in ${booking.city}`,
      receipt_email: booking.visitor.email,
    });

    // Update booking with Payment Intent ID
    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripePiId: paymentIntent.id },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
