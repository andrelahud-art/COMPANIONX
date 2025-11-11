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

    // Moderate content
    const moderation = await moderateContent(data.content);

    // Create message
    const message = await prisma.message.create({
      data: {
        fromUserId: authUser.id,
        toUserId: data.toUserId,
        content: data.content,
        bookingId: data.bookingId,
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
