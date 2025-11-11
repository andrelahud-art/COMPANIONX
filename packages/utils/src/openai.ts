import OpenAI from 'openai';

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Generate embedding using text-embedding-3-large (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    encoding_format: 'float',
  });

  return response.data[0].embedding;
}

/**
 * Build composite profile text for embedding generation
 */
export function buildCompanionProfileText(profile: {
  languages: string[];
  cities: string[];
  interests: string[];
  certifications?: string[];
  bio?: string;
  vehicleType?: string;
}): string {
  const parts: string[] = [];

  // Languages
  if (profile.languages.length > 0) {
    parts.push(`Languages: ${profile.languages.join(', ')}`);
  }

  // Cities
  if (profile.cities.length > 0) {
    parts.push(`Cities: ${profile.cities.join(', ')}`);
  }

  // Interests
  if (profile.interests.length > 0) {
    parts.push(`Interests: ${profile.interests.join(', ')}`);
  }

  // Certifications
  if (profile.certifications && profile.certifications.length > 0) {
    parts.push(`Certifications: ${profile.certifications.join(', ')}`);
  }

  // Vehicle
  if (profile.vehicleType && profile.vehicleType !== 'none') {
    parts.push(`Transportation: ${profile.vehicleType}`);
  }

  // Bio
  if (profile.bio) {
    parts.push(`Bio: ${profile.bio}`);
  }

  return parts.join(' | ');
}

export function buildVisitorProfileText(profile: {
  languages: string[];
  fifaCities: string[];
  interests: string[];
  bio?: string;
  budgetMXN?: number;
}): string {
  const parts: string[] = [];

  // Languages
  if (profile.languages.length > 0) {
    parts.push(`Languages: ${profile.languages.join(', ')}`);
  }

  // FIFA Cities
  if (profile.fifaCities.length > 0) {
    parts.push(`Destinations: ${profile.fifaCities.join(', ')}`);
  }

  // Interests
  if (profile.interests.length > 0) {
    parts.push(`Interests: ${profile.interests.join(', ')}`);
  }

  // Budget
  if (profile.budgetMXN) {
    parts.push(`Budget: ${profile.budgetMXN} MXN/day`);
  }

  // Bio
  if (profile.bio) {
    parts.push(`Bio: ${profile.bio}`);
  }

  return parts.join(' | ');
}

/**
 * Moderate text content using OpenAI moderation API
 */
export async function moderateContent(text: string): Promise<{
  flagged: boolean;
  categories: string[];
  categoryScores: Record<string, number>;
}> {
  const client = getOpenAIClient();

  const response = await client.moderations.create({
    input: text,
  });

  const result = response.results[0];

  const flaggedCategories: string[] = [];
  const scores: Record<string, number> = {};

  for (const [category, flagged] of Object.entries(result.categories)) {
    if (flagged) {
      flaggedCategories.push(category);
    }
    const scoreKey = `${category}_score` as keyof typeof result.category_scores;
    scores[category] = result.category_scores[scoreKey] || 0;
  }

  return {
    flagged: result.flagged,
    categories: flaggedCategories,
    categoryScores: scores,
  };
}
