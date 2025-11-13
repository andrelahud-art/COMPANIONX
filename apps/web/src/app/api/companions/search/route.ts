import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import type { Prisma } from '@companionx/db';
import { generateEmbedding, rankCandidates, type CompanionCandidate } from '@companionx/utils';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
  date: z.string().optional(),
  hasVehicle: z.boolean().optional(),
  maxPriceMXN: z.number().optional(),
  limit: z.number().default(10),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = searchSchema.parse({
      query: searchParams.get('query') || undefined,
      city: searchParams.get('city') || undefined,
      language: searchParams.get('language') || undefined,
      date: searchParams.get('date') || undefined,
      hasVehicle: searchParams.get('hasVehicle') === 'true',
      maxPriceMXN: searchParams.get('maxPriceMXN') ? parseInt(searchParams.get('maxPriceMXN')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    });

    const targetDate = params.date ? new Date(params.date) : undefined;

    // Build where clause
    const where: Prisma.CompanionProfileWhereInput = {
      isActive: true,
      user: {
        isActive: true,
        isBanned: false,
      },
    };

    if (params.city) {
      where.cities = { has: params.city };
    }

    if (params.hasVehicle) {
      where.hasVehicle = true;
    }

    // Fetch candidates (first 50 for reranking)
    // In production, use pgvector for similarity search
    const companionInclude = {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          languages: true,
          rating: true,
          ratingsCount: true,
          kycLevel: true,
          isBanned: true,
        },
      },
      availability: targetDate
        ? {
            where: {
              isBooked: false,
              from: { lte: targetDate },
              to: { gte: targetDate },
            },
          }
        : {
            orderBy: { from: 'asc' },
            take: 5,
          },
    } satisfies Prisma.CompanionProfileInclude;

    type CompanionWithUser = Prisma.CompanionProfileGetPayload<{
      include: typeof companionInclude;
    }>;

    const companions: CompanionWithUser[] = await prisma.companionProfile.findMany({
      where,
      take: 50,
      include: companionInclude,
    });

    // Pre-compute similarity using embeddings if query provided
    let queryEmbedding: number[] | null = null;
    if (params.query) {
      try {
        queryEmbedding = await generateEmbedding(params.query);
      } catch (error) {
        console.warn('Failed to generate search embedding:', error);
      }
    }

    const similarityMap = new Map<string, number>();
    if (queryEmbedding) {
      const normalize = (vector: number[]) => {
        const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
        return vector.map((value) => value / (norm || 1));
      };

      const normalizedQuery = normalize(queryEmbedding);

      companions.forEach((companion) => {
        const embedding = (companion as any).embedding as number[] | null | undefined;
        if (!embedding || embedding.length === 0) {
          return;
        }

        const normalizedEmbedding = normalize(embedding);
        const similarity = normalizedEmbedding.reduce((sum, value, index) => sum + value * (normalizedQuery[index] ?? 0), 0);
        similarityMap.set(companion.id, similarity);
      });
    }

    // Map to CompanionCandidate format
    const candidates: CompanionCandidate[] = companions.map((companion) => ({
      id: companion.id,
      userId: companion.userId,
      name: companion.user.name,
      avatarUrl: companion.user.avatarUrl || undefined,
      languages: companion.user.languages,
      cities: companion.cities,
      baseCity: companion.baseCity || undefined,
      interests: companion.interests,
      hasVehicle: companion.hasVehicle,
      vehicleType: companion.vehicleType || undefined,
      certifications: companion.certifications,
      hourlyRateMXN: companion.hourlyRateMXN,
      rating: companion.user.rating,
      ratingsCount: companion.user.ratingsCount,
      isVerified: companion.isVerified,
      kycLevel: Number(companion.user.kycLevel.replace('V', '')),
      isBanned: companion.user.isBanned,
      similarityScore: similarityMap.get(companion.id) ?? 0,
      isAvailable: targetDate ? companion.availability.length > 0 : undefined,
      availabilityWindows: companion.availability.map((slot) => ({
        from: slot.from,
        to: slot.to,
        city: slot.city,
      })),
    }));

    // Apply ranking
    const ranked = rankCandidates(
      candidates,
      {
        preferredLanguages: params.language ? [params.language] : [],
        targetCity: params.city || '',
        maxBudgetMXN: params.maxPriceMXN,
        needsVehicle: params.hasVehicle,
        targetDate,
      }
    );

    // Return top N
    const results = ranked.slice(0, params.limit).map((r) => ({
      companion: {
        id: r.candidate.id,
        userId: r.candidate.userId,
        name: r.candidate.name,
        avatarUrl: r.candidate.avatarUrl,
        languages: r.candidate.languages,
        cities: r.candidate.cities,
        baseCity: r.candidate.baseCity,
        interests: r.candidate.interests,
        hasVehicle: r.candidate.hasVehicle,
        vehicleType: r.candidate.vehicleType,
        hourlyRateMXN: r.candidate.hourlyRateMXN,
        rating: r.candidate.rating,
        ratingsCount: r.candidate.ratingsCount,
        isVerified: r.candidate.isVerified,
      },
      score: r.totalScore,
      reasons: r.reasons,
    }));

    return NextResponse.json({
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
