import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createClient } from '@/lib/supabase/server';
import { moderateContent } from '@companionx/utils';
import { z } from 'zod';

const sendMessageSchema = z.object({
  toUserId: z.string(),
  content: z.string().min(1).max(2000),
  bookingId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = sendMessageSchema.parse(body);

    // Ensure there is a booking relationship between the users
    const booking = data.bookingId
      ? await prisma.booking.findUnique({
          where: { id: data.bookingId },
        })
      : await prisma.booking.findFirst({
          where: {
            OR: [
              { visitorId: authUser.id, companionId: data.toUserId },
              { visitorId: data.toUserId, companionId: authUser.id },
            ],
            status: { in: ['PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED'] },
          },
          orderBy: { createdAt: 'desc' },
        });

    if (!booking) {
      return NextResponse.json({ error: 'Messaging requires an active booking' }, { status: 403 });
    }

    if (
      booking.visitorId !== authUser.id &&
      booking.visitorId !== data.toUserId &&
      booking.companionId !== authUser.id &&
      booking.companionId !== data.toUserId
    ) {
      return NextResponse.json({ error: 'Users are not part of the same booking' }, { status: 403 });
    }

    // Moderate content
    const moderation = await moderateContent(data.content);

    // Create message
    const message = await prisma.message.create({
      data: {
        fromUserId: authUser.id,
        toUserId: data.toUserId,
        content: data.content,
        bookingId: booking.id,
        moderated: true,
        flagged: moderation.flagged,
        flagReason: moderation.flagged ? moderation.categories.join(', ') : null,
      },
    });

    // If flagged, block the message
    if (moderation.flagged) {
      return NextResponse.json({
        success: false,
        error: 'Message flagged for moderation',
        categories: moderation.categories,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const withUserId = searchParams.get('withUserId');

    if (!withUserId) {
      return NextResponse.json({ error: 'withUserId required' }, { status: 400 });
    }

    const hasBooking = await prisma.booking.count({
      where: {
        OR: [
          { visitorId: authUser.id, companionId: withUserId },
          { visitorId: withUserId, companionId: authUser.id },
        ],
        status: { in: ['PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED'] },
      },
    });

    if (hasBooking === 0) {
      return NextResponse.json({ error: 'Conversation not allowed without a booking' }, { status: 403 });
    }

    // Fetch messages between users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: authUser.id, toUserId: withUserId },
          { fromUserId: withUserId, toUserId: authUser.id },
        ],
        flagged: false, // Don't show flagged messages
      },
      orderBy: { createdAt: 'asc' },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Mark as read
    await prisma.message.updateMany({
      where: {
        fromUserId: withUserId,
        toUserId: authUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
