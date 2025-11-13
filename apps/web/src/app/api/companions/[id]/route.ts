import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const companion = await prisma.companionProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            languages: true,
            rating: true,
            ratingsCount: true,
            kycLevel: true,
          },
        },
        availability: {
          where: { isBooked: false, to: { gte: new Date() } },
          orderBy: { from: 'asc' },
          take: 10,
        },
      },
    });

    if (!companion) {
      return NextResponse.json({ error: 'Companion not found' }, { status: 404 });
    }

    return NextResponse.json({
      companion: {
        id: companion.id,
        bio: companion.bio,
        tagline: companion.tagline,
        cities: companion.cities,
        baseCity: companion.baseCity,
        interests: companion.interests,
        certifications: companion.certifications,
        hourlyRateMXN: companion.hourlyRateMXN,
        hasVehicle: companion.hasVehicle,
        vehicleType: companion.vehicleType,
        photos: companion.photos,
        isVerified: companion.isVerified,
        user: companion.user,
        availability: companion.availability,
      },
    });
  } catch (error) {
    console.error('Get companion detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
