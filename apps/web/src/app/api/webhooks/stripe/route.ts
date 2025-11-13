import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@companionx/db';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.instance.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(paymentIntent);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handling error:', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;

  if (!bookingId) {
    console.warn('Payment intent missing booking metadata');
    return;
  }

  await prisma.booking.updateMany({
    where: { id: bookingId, status: { in: ['PENDING', 'PAID'] } },
    data: {
      status: 'PAID',
      stripePiId: paymentIntent.id,
      confirmedAt: new Date(),
    },
  });
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;

  if (!bookingId) {
    return;
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancellationReason: paymentIntent.last_payment_error?.message ?? 'Payment failed',
    },
  });

  await prisma.availability.updateMany({
    where: {
      companion: { userId: booking.companionId },
      from: { lte: booking.from },
      to: { gte: booking.to },
      isBooked: true,
    },
    data: { isBooked: false },
  });
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;

  if (!bookingId) {
    return;
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    return;
  }

  if (booking.status !== 'PENDING') {
    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancellationReason: 'Payment intent canceled at Stripe',
    },
  });

  await prisma.availability.updateMany({
    where: {
      companion: { userId: booking.companionId },
      from: { lte: booking.from },
      to: { gte: booking.to },
      isBooked: true,
    },
    data: { isBooked: false },
  });
}
