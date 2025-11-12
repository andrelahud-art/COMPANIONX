import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@companionx/db';
import type { Prisma } from '@companionx/db';
import {
  rankCandidates,
  type CompanionCandidate,
  type RankedResult,
} from '@companionx/utils';
import { ZodError, z } from 'zod';

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
    const hasVehicleParam = searchParams.get('hasVehicle');
    const maxPriceParam = searchParams.get('maxPriceMXN');
    const limitParam = searchParams.get('limit');

    const params = searchSchema.parse({
      query: optionalString(searchParams.get('query')),
      city: optionalString(searchParams.get('city')),
      language: optionalString(searchParams.get('language')),
      date: optionalString(searchParams.get('date')),
      hasVehicle: hasVehicleParam === null ? undefined : hasVehicleParam === 'true',
      maxPriceMXN: parseNumberParam(maxPriceParam),
      limit: parseNumberParam(limitParam) ?? 10,
    });

    type CompanionFindManyArgs = Parameters<
      typeof prisma.companionProfile.findMany
    >[0];
    type CompanionWhere = NonNullable<CompanionFindManyArgs['where']>;
    type CompanionInclude = NonNullable<CompanionFindManyArgs['include']>;
    type UserRelation = NonNullable<CompanionWhere['user']>;
    type UserWhere = UserRelation extends { is?: infer W }
      ? NonNullable<W>
      : Prisma.UserWhereInput;
    type AvailabilityRelation = NonNullable<CompanionWhere['availability']>;
    type AvailabilityWhere = AvailabilityRelation extends { some?: infer W }
      ? NonNullable<W>
      : Prisma.AvailabilityWhereInput;

    const sanitizedLimit = clamp(params.limit, 1, 20);
    const searchKeywords = extractKeywords(params.query);

    const userWhere: UserWhere = {
      isActive: true,
      isBanned: false,
    };

    if (params.language) {
      userWhere.languages = { has: params.language };
    }

    const where: CompanionWhere = {
      isActive: true,
      user: { is: userWhere },
    };

    if (params.city) {
      const normalizedCity = params.city.trim();
      if (normalizedCity) {
        const cityKeywords = Array.from(
          new Set([
            normalizedCity,
            normalizedCity.toLowerCase(),
            normalizedCity.toUpperCase(),
          ])
        );
        where.AND = [
          ...(where.AND ?? []),
          {
            OR: [
              { baseCity: { contains: normalizedCity, mode: 'insensitive' } },
              { cities: { hasSome: cityKeywords } },
            ],
          },
        ];
      }
    }

    if (params.hasVehicle === true) {
      where.hasVehicle = true;
    }

    if (params.maxPriceMXN !== undefined) {
      where.hourlyRateMXN = { lte: params.maxPriceMXN };
    }

    const requestedDate = params.date ? safeDate(params.date) : undefined;

    if (requestedDate) {
      const availabilityFilter: AvailabilityWhere = {
        from: { lte: requestedDate },
        to: { gte: requestedDate },
        isBooked: false,
      };

      where.availability = {
        some: availabilityFilter,
      };
    }

    if (searchKeywords.length > 0) {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: buildKeywordFilters(searchKeywords),
        },
      ];
    }

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
    } satisfies CompanionInclude;

    const fetchTake = Math.min(sanitizedLimit * 3, 50);

    const companions = await prisma.companionProfile.findMany({
      where,
      take: fetchTake,
      include: companionInclude,
      orderBy: { updatedAt: 'desc' },
    });

    type CompanionWithUser = Prisma.CompanionProfileGetPayload<{
      include: typeof companionInclude;
    }>;

    const candidates: CompanionCandidate[] = companions.map(
      (companion: CompanionWithUser) => ({
        id: companion.id,
        userId: companion.userId,
        name: companion.user.name,
        avatarUrl: companion.user.avatarUrl ?? undefined,
        languages: companion.user.languages,
        cities: companion.cities,
        baseCity: companion.baseCity ?? undefined,
        interests: companion.interests,
        hasVehicle: companion.hasVehicle,
        vehicleType: companion.vehicleType ?? undefined,
        certifications: companion.certifications,
        hourlyRateMXN: companion.hourlyRateMXN,
        rating: companion.user.rating,
        ratingsCount: companion.user.ratingsCount,
        isVerified: companion.isVerified,
        kycLevel: parseKycLevel(companion.user.kycLevel),
        isBanned: companion.user.isBanned,
        similarityScore: computeSimilarityScore(companion, searchKeywords),
      })
    );

    const ranked: RankedResult[] = rankCandidates(candidates, {
      preferredLanguages: params.language ? [params.language] : [],
      targetCity: params.city ?? '',
      targetDate: requestedDate,
      maxBudgetMXN: params.maxPriceMXN,
      needsVehicle: params.hasVehicle,
    });

    const results = ranked.slice(0, sanitizedLimit).map((result) => ({
      companion: {
        id: result.candidate.id,
        userId: result.candidate.userId,
        name: result.candidate.name,
        avatarUrl: result.candidate.avatarUrl,
        languages: result.candidate.languages,
        cities: result.candidate.cities,
        baseCity: result.candidate.baseCity,
        interests: result.candidate.interests,
        hasVehicle: result.candidate.hasVehicle,
        vehicleType: result.candidate.vehicleType,
        hourlyRateMXN: result.candidate.hourlyRateMXN,
        rating: result.candidate.rating,
        ratingsCount: result.candidate.ratingsCount,
        isVerified: result.candidate.isVerified,
      },
      score: result.totalScore,
      reasons: result.reasons,
    }));

    return NextResponse.json({
      results,
      count: results.length,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const zodError = error as ZodError;
      return NextResponse.json(
        { error: 'Invalid input', details: zodError.issues },
        { status: 400 }
      );
    }

    const isError = error instanceof Error;
    const message = isError ? error.message : 'Unknown error';
    console.error('Search error:', message, isError ? error : undefined);

    return NextResponse.json(
      { error: 'Internal server error', message },
      { status: 500 }
    );
  }
}

function parseNumberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function optionalString(value: string | null): string | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function extractKeywords(query?: string): string[] {
  if (!query) return [];
  return query
    .toLowerCase()
    .split(/[^a-záéíóúüñ0-9]+/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 1)
    .slice(0, 10)
    .filter((value, index, array) => array.indexOf(value) === index);
}

function buildKeywordFilters(
  keywords: string[]
): Prisma.CompanionProfileWhereInput[] {
  if (keywords.length === 0) {
    return [];
  }

  const keywordFilters: Prisma.CompanionProfileWhereInput[] = [];

  for (const keyword of keywords) {
    const keywordVariants = Array.from(
      new Set([keyword, keyword.toLowerCase(), keyword.toUpperCase()])
    );
    keywordFilters.push(
      {
        user: {
          is: {
            name: { contains: keyword, mode: 'insensitive' },
          },
        },
      },
      { baseCity: { contains: keyword, mode: 'insensitive' } },
      { cities: { hasSome: keywordVariants } },
      { interests: { hasSome: keywordVariants } },
      { certifications: { hasSome: keywordVariants } },
      { tagline: { contains: keyword, mode: 'insensitive' } },
      { bio: { contains: keyword, mode: 'insensitive' } }
    );
  }

  return keywordFilters;
}

function parseKycLevel(kycLevel: Prisma.$Enums.KYCLevel): number {
  const numeric = Number.parseInt(kycLevel.replace(/\D+/g, ''), 10);
  return Number.isNaN(numeric) ? 0 : numeric;
}

function computeSimilarityScore(
  companion: Prisma.CompanionProfileGetPayload<{
    include: {
      user: {
        select: {
          name: true;
          languages: true;
        };
      };
    };
  }>,
  keywords: string[]
): number {
  if (keywords.length === 0) {
    return 0;
  }

  const fieldsToSearch: string[] = [
    companion.user.name,
    companion.baseCity ?? '',
    companion.tagline ?? '',
    companion.bio ?? '',
    ...companion.cities,
    ...companion.interests,
    ...companion.certifications,
    ...companion.user.languages,
  ].map((value) => value.toLowerCase());

  let score = 0;
  for (const keyword of keywords) {
    for (const field of fieldsToSearch) {
      if (field.includes(keyword)) {
        score += 1;
        break;
      }
    }
  }

  return score;
}

function safeDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
