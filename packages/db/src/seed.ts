import { PrismaClient, Role, KYCLevel } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const CITIES = ['CDMX', 'GDL', 'MTY'];
const INTERESTS = ['gastronomia', 'futbol', 'cultura', 'nightlife', 'compras', 'musica', 'arte'];
const CERTIFICATIONS = ['first_aid', 'driver', 'tour_guide', 'translator'];
const LANGUAGES = ['es', 'en', 'fr', 'de', 'pt', 'it'];
const VEHICLE_TYPES = ['car', 'suv', 'van', 'moto', 'none'];
const REVIEW_TAGS = ['puntual', 'seguro', 'gran_guia', 'flexible', 'profesional', 'amigable'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.companionProfile.deleteMany();
  await prisma.visitorProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('👥 Creating companions...');
  const companions: any[] = [];

  for (let i = 0; i < 50; i++) {
    const gender = faker.person.sex();
    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    const mainLanguage = i < 40 ? 'es' : randomItems(LANGUAGES, 1)[0];
    const languages = [
      mainLanguage,
      ...randomItems(LANGUAGES.filter((l) => l !== mainLanguage), randomInt(0, 2)),
    ];

    const baseCity = CITIES[i % CITIES.length];
    const cities = [baseCity, ...randomItems(CITIES.filter((c) => c !== baseCity), randomInt(0, 1))];

    const hasVehicle = Math.random() > 0.4;
    const vehicleType = hasVehicle ? randomItems(VEHICLE_TYPES.filter((v) => v !== 'none'), 1)[0] : 'none';

    const interests = randomItems(INTERESTS, randomInt(2, 5));
    const certifications = randomItems(CERTIFICATIONS, randomInt(0, 3));

    const hourlyRate = randomInt(200, 800);
    const block3hRate = Math.round(hourlyRate * 3 * 0.9);
    const block6hRate = Math.round(hourlyRate * 6 * 0.85);

    const isVerified = Math.random() > 0.2; // 80% verified
    const kycLevel = isVerified ? (Math.random() > 0.5 ? KYCLevel.V2 : KYCLevel.V1) : KYCLevel.V0;

    const rating = isVerified ? parseFloat((3.5 + Math.random() * 1.5).toFixed(1)) : 0;
    const ratingsCount = isVerified ? randomInt(0, 50) : 0;

    const user = await prisma.user.create({
      data: {
        id: faker.string.uuid(),
        role: Role.COMPANION,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        name,
        country: 'MX',
        languageMain: mainLanguage,
        languages,
        avatarUrl: faker.image.avatar(),
        kycLevel,
        rating,
        ratingsCount,
        isActive: true,
        isBanned: false,
      },
    });

    const companionProfile = await prisma.companionProfile.create({
      data: {
        userId: user.id,
        cities,
        baseCity,
        hasVehicle,
        vehicleType,
        interests,
        certifications,
        hourlyRateMXN: hourlyRate,
        block3hRateMXN: block3hRate,
        block6hRateMXN: block6hRate,
        bio: faker.lorem.paragraph(),
        tagline: faker.company.catchPhrase(),
        isActive: true,
        isVerified,
        totalBookings: ratingsCount,
        completedBookings: ratingsCount,
      },
    });

    companions.push({ user, profile: companionProfile });

    // Add availability (random slots over next 30 days)
    for (let j = 0; j < randomInt(3, 8); j++) {
      const startDate = faker.date.soon({ days: 30 });
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + randomInt(3, 12));

      await prisma.availability.create({
        data: {
          companionId: companionProfile.id,
          from: startDate,
          to: endDate,
          city: randomItems(cities, 1)[0],
          isBooked: false,
        },
      });
    }
  }

  console.log(`✅ Created ${companions.length} companions`);

  console.log('🧳 Creating visitors...');
  const visitors: any[] = [];

  for (let i = 0; i < 200; i++) {
    const gender = faker.person.sex();
    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    const country = randomItems(['US', 'CA', 'BR', 'AR', 'UK', 'FR', 'DE', 'ES', 'IT', 'JP'], 1)[0];
    const mainLanguage = country === 'US' || country === 'UK' ? 'en' : randomItems(LANGUAGES, 1)[0];
    const languages = [mainLanguage, ...randomItems(LANGUAGES.filter((l) => l !== mainLanguage), randomInt(0, 1))];

    const fifaCities = randomItems(CITIES, randomInt(1, 3));
    const interests = randomItems(INTERESTS, randomInt(2, 4));
    const budgetMXN = randomInt(500, 3000);

    const arrivalDate = faker.date.soon({ days: 60 });
    const departureDate = new Date(arrivalDate);
    departureDate.setDate(departureDate.getDate() + randomInt(3, 14));

    const user = await prisma.user.create({
      data: {
        id: faker.string.uuid(),
        role: Role.VISITOR,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        name,
        country,
        languageMain: mainLanguage,
        languages,
        avatarUrl: faker.image.avatar(),
        kycLevel: KYCLevel.V0,
        isActive: true,
        isBanned: false,
      },
    });

    const visitorProfile = await prisma.visitorProfile.create({
      data: {
        userId: user.id,
        fifaCities,
        interests,
        budgetMXN,
        arrivalDate,
        departureDate,
        travelingFrom: country,
        bio: faker.lorem.sentence(),
      },
    });

    visitors.push({ user, profile: visitorProfile });
  }

  console.log(`✅ Created ${visitors.length} visitors`);

  console.log('📅 Creating bookings and reviews...');
  let reviewCount = 0;

  // Create some past bookings with reviews
  for (let i = 0; i < 40; i++) {
    const visitor = randomItems(visitors, 1)[0];
    const companion = randomItems(companions, 1)[0];

    const startDate = faker.date.recent({ days: 90 });
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + randomInt(3, 8));

    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const priceMXN = Math.round(companion.profile.hourlyRateMXN * durationHours);
    const platformFeeMXN = Math.round(priceMXN * 0.15);
    const companionPayoutMXN = priceMXN - platformFeeMXN;

    const booking = await prisma.booking.create({
      data: {
        visitorId: visitor.user.id,
        companionId: companion.user.id,
        city: randomItems(companion.profile.cities, 1)[0],
        from: startDate,
        to: endDate,
        durationHours,
        priceMXN,
        platformFeeMXN,
        companionPayoutMXN,
        status: 'COMPLETED',
        confirmedAt: startDate,
        completedAt: endDate,
      },
    });

    // Create review
    const rating = randomInt(3, 5);
    const tags = randomItems(REVIEW_TAGS, randomInt(2, 4));

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        visitorId: visitor.user.id,
        companionId: companion.user.id,
        rating,
        tags,
        comment: faker.lorem.sentences(2),
        isVisible: true,
        flagged: false,
      },
    });

    // Update companion rating
    const currentRating = companion.user.rating;
    const currentCount = companion.user.ratingsCount;
    const newCount = currentCount + 1;
    const newRating = (currentRating * currentCount + rating) / newCount;

    await prisma.user.update({
      where: { id: companion.user.id },
      data: {
        rating: parseFloat(newRating.toFixed(1)),
        ratingsCount: newCount,
      },
    });

    companion.user.rating = newRating;
    companion.user.ratingsCount = newCount;

    reviewCount++;
  }

  console.log(`✅ Created ${reviewCount} bookings with reviews`);

  // Create ranking weights
  await prisma.rankingWeights.create({
    data: {
      name: 'default',
      weights: {
        language: 3,
        city: 4,
        availability: 3,
        distance: 2,
        rating: 2,
        price: 1,
        vehicle: 1.5,
        certification: 1,
        safety: -100,
      },
      isActive: true,
    },
  });

  console.log('✅ Created default ranking weights');

  console.log('🎉 Seed completed!');
  console.log(`   - ${companions.length} companions`);
  console.log(`   - ${visitors.length} visitors`);
  console.log(`   - ${reviewCount} bookings with reviews`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
