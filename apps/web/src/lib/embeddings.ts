import { prisma } from '@companionx/db';
import { buildCompanionProfileText, buildVisitorProfileText, generateEmbedding } from '@companionx/utils';

async function maybeGenerateEmbedding(text: string | null) {
  if (!text || text.trim().length === 0) {
    return null;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY missing, skipping embedding generation');
    return null;
  }

  return generateEmbedding(text);
}

export async function syncCompanionEmbedding(companionId: string) {
  const companion = await prisma.companionProfile.findUnique({
    where: { id: companionId },
    include: {
      user: {
        select: {
          languages: true,
        },
      },
    },
  });

  if (!companion) {
    return;
  }

  const text = buildCompanionProfileText({
    languages: companion.user.languages,
    cities: companion.cities,
    interests: companion.interests,
    certifications: companion.certifications,
    bio: companion.bio ?? undefined,
    vehicleType: companion.vehicleType ?? undefined,
  });

  const embedding = await maybeGenerateEmbedding(text);

  if (!embedding) {
    return;
  }

  await prisma.companionProfile.update({
    where: { id: companion.id },
    data: {
      embedding,
      embeddingUpdatedAt: new Date(),
    },
  });
}

export async function syncVisitorEmbedding(visitorId: string) {
  const visitor = await prisma.visitorProfile.findUnique({
    where: { id: visitorId },
    include: {
      user: {
        select: {
          languages: true,
        },
      },
    },
  });

  if (!visitor) {
    return;
  }

  const text = buildVisitorProfileText({
    languages: visitor.user.languages,
    fifaCities: visitor.fifaCities,
    interests: visitor.interests,
    bio: visitor.bio ?? undefined,
    budgetMXN: visitor.budgetMXN ?? undefined,
  });

  const embedding = await maybeGenerateEmbedding(text);

  if (!embedding) {
    return;
  }

  await prisma.visitorProfile.update({
    where: { id: visitor.id },
    data: {
      embedding,
      embeddingUpdatedAt: new Date(),
    },
  });
}
