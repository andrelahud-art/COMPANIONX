/**
 * AI-powered ranking and recommendation engine
 * Combines vector similarity with rule-based scoring
 */

export interface RankingWeights {
  language: number;
  city: number;
  availability: number;
  distance: number;
  rating: number;
  price: number;
  vehicle: number;
  certification: number;
  safety: number; // Negative weight for flagged users
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  language: 3,
  city: 4,
  availability: 3,
  distance: 2,
  rating: 2,
  price: 1,
  vehicle: 1.5,
  certification: 1,
  safety: -100, // Heavily penalize safety issues
};

export interface CompanionCandidate {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  languages: string[];
  cities: string[];
  baseCity?: string;
  interests: string[];
  hasVehicle: boolean;
  vehicleType?: string;
  certifications: string[];
  hourlyRateMXN: number;
  rating: number;
  ratingsCount: number;
  isVerified: boolean;
  kycLevel: number;
  isBanned: boolean;
  isAvailable?: boolean;
  availabilityWindows?: { from: Date; to: Date; city: string }[];
  // From pgvector similarity
  similarityScore?: number;
  // Computed distance (if coordinates available)
  distanceKm?: number;
}

export interface RankingContext {
  preferredLanguages: string[];
  targetCity: string;
  targetDate?: Date;
  maxBudgetMXN?: number;
  needsVehicle?: boolean;
  visitorLocation?: { lat: number; lng: number };
}

export interface RankedResult {
  candidate: CompanionCandidate;
  totalScore: number;
  breakdown: {
    language: number;
    city: number;
    availability: number;
    distance: number;
    rating: number;
    price: number;
    vehicle: number;
    certification: number;
    safety: number;
    similarity: number;
  };
  reasons: string[]; // Explainability
}

/**
 * Rank candidates using weighted scoring + explainability
 */
export function rankCandidates(
  candidates: CompanionCandidate[],
  context: RankingContext,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS
): RankedResult[] {
  const results: RankedResult[] = candidates.map((candidate) => {
    const breakdown = {
      language: scoreLanguageMatch(candidate.languages, context.preferredLanguages, weights.language),
      city: scoreCityMatch(candidate.cities, candidate.baseCity, context.targetCity, weights.city),
      availability: scoreAvailability(candidate, context.targetDate, weights.availability),
      distance: scoreDistance(candidate.distanceKm, weights.distance),
      rating: scoreRating(candidate.rating, candidate.ratingsCount, weights.rating),
      price: scorePricing(candidate.hourlyRateMXN, context.maxBudgetMXN, weights.price),
      vehicle: scoreVehicle(candidate.hasVehicle, context.needsVehicle, weights.vehicle),
      certification: scoreCertifications(candidate.certifications, weights.certification),
      safety: scoreSafety(candidate.isBanned, candidate.kycLevel, candidate.isVerified, weights.safety),
      similarity: candidate.similarityScore || 0,
    };

    const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    const reasons = buildExplainability(candidate, context, breakdown);

    return {
      candidate,
      totalScore,
      breakdown,
      reasons,
    };
  });

  // Sort by total score descending
  return results.sort((a, b) => b.totalScore - a.totalScore);
}

// ============================================
// SCORING FUNCTIONS
// ============================================

function scoreLanguageMatch(
  candidateLangs: string[],
  preferredLangs: string[],
  weight: number
): number {
  if (preferredLangs.length === 0) return 0;

  // Check for exact match with top preference
  const topPreference = preferredLangs[0];
  if (candidateLangs.includes(topPreference)) {
    return weight * 1.0; // Full score
  }

  // Check for any overlap
  const overlap = candidateLangs.filter((lang) => preferredLangs.includes(lang));
  if (overlap.length > 0) {
    return weight * 0.5; // Partial score
  }

  return 0;
}

function scoreCityMatch(
  candidateCities: string[],
  baseCity: string | undefined,
  targetCity: string,
  weight: number
): number {
  // Exact match with base city (highest priority)
  if (baseCity === targetCity) {
    return weight * 1.0;
  }

  // Available in target city
  if (candidateCities.includes(targetCity)) {
    return weight * 0.7;
  }

  return 0;
}

function scoreAvailability(
  candidate: CompanionCandidate,
  targetDate: Date | undefined,
  weight: number
): number {
  if (!targetDate) {
    return 0;
  }

  if (candidate.isAvailable === false) {
    return -weight; // Penalize explicit unavailability
  }

  if (candidate.isAvailable) {
    return weight;
  }

  if (!candidate.availabilityWindows || candidate.availabilityWindows.length === 0) {
    return 0;
  }

  const match = candidate.availabilityWindows.some((slot) => {
    return slot.from <= targetDate && slot.to >= targetDate;
  });

  return match ? weight * 0.6 : -weight * 0.5;
}

function scoreDistance(distanceKm: number | undefined, weight: number): number {
  if (!distanceKm) return 0;

  if (distanceKm < 5) return weight * 1.0;
  if (distanceKm < 10) return weight * 0.7;
  if (distanceKm < 20) return weight * 0.4;
  return 0;
}

function scoreRating(rating: number, count: number, weight: number): number {
  if (count === 0) return 0; // No reviews yet

  // Boost for high ratings with volume
  if (rating >= 4.5 && count >= 10) return weight * 1.0;
  if (rating >= 4.0 && count >= 5) return weight * 0.7;
  if (rating >= 3.5) return weight * 0.4;

  return 0;
}

function scorePricing(
  hourlyRate: number,
  maxBudget: number | undefined,
  weight: number
): number {
  if (!maxBudget) return 0;

  // Assuming 4-hour average booking
  const estimatedCost = hourlyRate * 4;

  if (estimatedCost <= maxBudget * 0.7) return weight * 1.0; // Great value
  if (estimatedCost <= maxBudget) return weight * 0.5; // Within budget
  if (estimatedCost <= maxBudget * 1.2) return weight * 0.2; // Slightly over

  return -weight * 0.5; // Over budget (penalty)
}

function scoreVehicle(
  hasVehicle: boolean,
  needsVehicle: boolean | undefined,
  weight: number
): number {
  if (!needsVehicle) return 0;
  return hasVehicle ? weight : 0;
}

function scoreCertifications(certs: string[], weight: number): number {
  // Bonus for valuable certifications
  const valuableCerts = ['first_aid', 'tour_guide', 'driver'];
  const matches = certs.filter((c) => valuableCerts.includes(c));
  return matches.length * (weight * 0.5);
}

function scoreSafety(
  isBanned: boolean,
  kycLevel: number,
  isVerified: boolean,
  weight: number
): number {
  if (isBanned) return weight; // Heavy penalty (weight is negative)

  // Bonus for verification
  let bonus = 0;
  if (isVerified) bonus += 1;
  if (kycLevel >= 2) bonus += 1; // V2+ (liveness check)
  if (kycLevel >= 3) bonus += 0.5; // V3 (address proof)

  return bonus;
}

// ============================================
// EXPLAINABILITY
// ============================================

function buildExplainability(
  candidate: CompanionCandidate,
  context: RankingContext,
  breakdown: RankedResult['breakdown']
): string[] {
  const reasons: string[] = [];

  // Language
  if (breakdown.language > 0) {
    const matchedLang = candidate.languages.find((l) => context.preferredLanguages.includes(l));
    if (matchedLang) {
      reasons.push(`Speaks ${matchedLang.toUpperCase()}`);
    }
  }

  // City
  if (breakdown.city > 0) {
    if (candidate.baseCity === context.targetCity) {
      reasons.push(`Based in ${context.targetCity}`);
    } else {
      reasons.push(`Available in ${context.targetCity}`);
    }
  }

  // Distance
  if (breakdown.distance > 0 && candidate.distanceKm) {
    reasons.push(`Only ${candidate.distanceKm.toFixed(1)} km away`);
  }

  // Rating
  if (breakdown.rating > 0) {
    reasons.push(`Highly rated (${candidate.rating.toFixed(1)}⭐, ${candidate.ratingsCount} reviews)`);
  }

  // Price
  if (breakdown.price > 0) {
    reasons.push(`Within your budget (${candidate.hourlyRateMXN} MXN/hr)`);
  }

  // Vehicle
  if (breakdown.vehicle > 0) {
    reasons.push(`Has ${candidate.vehicleType || 'vehicle'} available`);
  }

  // Certifications
  if (breakdown.certification > 0) {
    const certs = candidate.certifications.join(', ');
    reasons.push(`Certified: ${certs}`);
  }

  // Verification
  if (candidate.isVerified) {
    reasons.push('ID verified');
  }

  // Common interests
  if (candidate.interests.length > 0) {
    const interestsPreview = candidate.interests.slice(0, 3).join(', ');
    reasons.push(`Interests: ${interestsPreview}`);
  }

  return reasons;
}
