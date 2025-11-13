import { NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all bookings for this companion
    const bookings = await prisma.booking.findMany({
      where: {
        companionId: user.id,
      },
      include: {
        visitor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get statistics
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'PENDING').length,
      confirmed: bookings.filter(b => b.status === 'PAID').length,
      inProgress: bookings.filter(b => b.status === 'IN_PROGRESS').length,
      completed: bookings.filter(b => b.status === 'COMPLETED').length,
      totalEarnings: bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.companionPayoutMXN, 0),
    };

    return NextResponse.json({ bookings, stats });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
