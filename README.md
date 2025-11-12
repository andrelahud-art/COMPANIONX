# CompanionX World 2026

AI-powered platform to connect FIFA World Cup 2026 visitors with verified local companions in Mexico.

## 🎯 Overview

CompanionX uses AI-powered matching to connect international visitors with verified local companions who share their interests and speak their language. Built for the FIFA World Cup 2026 in Mexico.

### Key Features

- **AI-Powered Matching**: OpenAI embeddings + pgvector for semantic search and intelligent recommendations
- **Verified Safety**: Multi-level KYC verification (V0 → V3) with Stripe Identity
- **Secure Payments**: Stripe Payment Intents + Connect for secure bookings and payouts
- **Real-time Chat**: With AI moderation via OpenAI
- **PWA**: Installable on iOS (16.4+) with offline support and web push notifications
- **i18n**: Full support for English and Spanish
- **Explainability**: Transparent AI recommendations with reasons

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router, React Server Components), Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (Edge + Node.js)
- **Database**: PostgreSQL (Supabase) with pgvector extension
- **Auth**: Supabase Auth (email OTP + OAuth)
- **Storage**: Supabase Storage (photos, documents)
- **Payments**: Stripe (Payment Intents + Connect Standard)
- **AI**: OpenAI (text-embedding-3-large, moderation)
- **Observability**: Sentry
- **Deployment**: Vercel (frontend + backend), Supabase (DB + Auth + Storage)

### Monorepo Structure

```
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── [locale]/   # i18n routes
│       │   │   └── api/        # REST API endpoints
│       │   ├── components/     # React components
│       │   ├── lib/            # Utilities (Supabase, Stripe, utils)
│       │   └── i18n.ts         # i18n configuration
│       ├── public/             # Static assets + PWA files
│       └── messages/           # i18n dictionaries
│
├── packages/
│   ├── db/                     # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── rls-policies.sql # Row Level Security
│   │   └── src/
│   │       ├── index.ts        # Prisma client export
│   │       └── seed.ts         # Seed script
│   │
│   └── utils/                  # Shared utilities
│       └── src/
│           ├── openai.ts       # AI embeddings + moderation
│           └── ranking.ts      # Ranking algorithm + explainability
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17+
- pnpm 8+
- PostgreSQL with pgvector extension (Supabase recommended)
- OpenAI API key
- Stripe account

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repo-url>
cd COMPANIONX
pnpm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

```env
# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
RESEND_API_KEY=re_...

# Sentry (optional)
SENTRY_DSN=https://...@sentry.io/...
```

3. **Set up database:**

Enable pgvector extension in Supabase:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Run migrations:

```bash
pnpm db:migrate
```

Apply RLS policies:

```bash
# In Supabase SQL Editor, run:
# packages/db/prisma/rls-policies.sql
```

4. **Seed database:**

```bash
pnpm db:seed
```

This creates:
- 50 verified companions across CDMX, GDL, MTY
- 200 visitors from multiple countries
- 40 completed bookings with reviews

5. **Run development server:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Core Models

- **User**: Base user model (VISITOR, COMPANION, ADMIN)
- **CompanionProfile**: Extended profile for companions (languages, cities, rates, etc.)
- **VisitorProfile**: Extended profile for visitors (trip details, interests)
- **Booking**: Booking records with payment and status tracking
- **Message**: Chat messages with AI moderation
- **Review**: Post-booking reviews with ratings and tags
- **Availability**: Companion availability slots

### AI Features

- `embedding` field (vector 1536): Stores OpenAI embeddings for semantic search
- Ranking algorithm with configurable weights (see `packages/utils/src/ranking.ts`)

## 🤖 AI Matching

### How It Works

1. **Profile Embeddings**: Composite text from languages, interests, cities, bio → OpenAI embedding
2. **Semantic Search**: Query embedding → pgvector cosine similarity → Top 50 candidates
3. **Rule-based Re-ranking**: Apply configurable weights:
   - Language match: +3
   - City match: +4
   - Availability overlap: +3
   - Distance: +2
   - Rating: +2
   - Price fit: +1
   - Safety flags: -100
4. **Explainability**: Return top 10 with reasons (e.g., "Speaks EN, Based in CDMX, Has vehicle")

### Customizing Weights

Edit via Admin Console or directly in database:

```sql
UPDATE "RankingWeights"
SET weights = '{"language": 3, "city": 5, "rating": 3, ...}'
WHERE name = 'default';
```

## 📱 PWA (iOS Support)

The app is installable on iOS 16.4+ as a Progressive Web App.

### Features

- **Manifest**: `/public/manifest.webmanifest`
- **Service Worker**: `/public/sw.js` with offline support
- **Web Push**: Notifications support (via OneSignal or VAPID)
- **Add to Home Screen**: Guided install flow

### Testing PWA

1. Open site in iOS Safari
2. Tap Share → Add to Home Screen
3. App opens in standalone mode

## 🔐 Security

### Authentication

- Supabase Auth with email OTP
- JWT tokens in HTTP-only cookies
- Row Level Security (RLS) policies

### KYC Verification

- **V0**: Email verified (default)
- **V1**: ID match (Stripe Identity)
- **V2**: Selfie liveness check
- **V3**: Address proof

### Content Moderation

- OpenAI Moderation API for all messages
- Automatic flagging of inappropriate content
- Admin review queue

### Payment Security

- PCI-compliant via Stripe
- Payment Intents (no card storage)
- Stripe Connect for companion payouts
- 15% platform fee

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user (visitor or companion)
- `POST /api/auth/login` - Login with email OTP

### Search & Matching

- `GET /api/companions/search` - Search companions with filters
  - Query params: `query`, `city`, `language`, `date`, `hasVehicle`, `maxPriceMXN`
  - Returns: Top 10 ranked companions with explainability

### Bookings

- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings/:id/confirm` - Confirm booking after payment

### Payments

- `POST /api/payments/intent` - Create Stripe Payment Intent
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Chat

- `POST /api/chat` - Send message (with moderation)
- `GET /api/chat?withUserId=...` - Get conversation

### Reviews

- `POST /api/reviews` - Create review (after completed booking)

## 🚢 Deployment

### Vercel (Recommended)

**Note:** The project includes `vercel.json` that pins pnpm 8.15.1 in the install/build commands, so Vercel uses the same version as local development.

1. **Push to GitHub**

2. **Import to Vercel:**
   - Connect GitHub repo
   - Framework preset: **Next.js**
   - Root directory: Leave empty (uses `vercel.json` config)
   - Build/Install commands: Automatically configured via `vercel.json`

3. **Set environment variables** in Vercel dashboard (copy from `.env.example`)

4. **Deploy!**

**Troubleshooting:**
- If build fails with a pnpm version error, confirm Vercel picked up the `vercel.json` commands that invoke `npx pnpm@8.15.1`
- Ensure Node.js version is 18.x or higher in Vercel project settings
- Check build logs for specific errors

### Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Enable pgvector extension (SQL Editor):
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run migrations (from local with `DATABASE_URL` set)
4. Apply RLS policies (SQL Editor → paste `rls-policies.sql`)
5. Configure Auth settings (email OTP enabled)
6. Create Storage buckets: `avatars`, `kyc-documents`

### Stripe Setup

1. Get API keys from [dashboard.stripe.com](https://dashboard.stripe.com)
2. Enable Stripe Connect (Standard accounts)
3. Configure webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

## 🧪 Testing

Run tests:

```bash
pnpm test
```

Test coverage includes:
- Ranking algorithm
- Embedding generation
- Content moderation
- Booking calculations

## 📈 Monitoring

### Sentry

- Automatic error tracking
- Performance monitoring
- Release tracking

### Logs

- Vercel logs for API routes
- Supabase logs for database queries

## 🗺️ Roadmap (60 Days to World Cup)

### Week 1-2: Foundation ✅
- [x] Monorepo setup
- [x] Database schema + migrations
- [x] Auth + KYC flow
- [x] PWA configuration

### Week 3-4: Core Features
- [x] AI matching + ranking
- [x] Booking flow
- [x] Stripe integration
- [x] Chat with moderation

### Week 5-6: Polish & Scale
- [ ] Admin dashboard
- [ ] Push notifications (iOS)
- [ ] Itinerary suggestions (AI)
- [ ] Performance optimization
- [ ] Load testing

### Week 7-8: Launch Prep
- [ ] KYC provider integration (Stripe Identity)
- [ ] Content moderation queue
- [ ] Analytics dashboard
- [ ] Partner onboarding (3 cities)
- [ ] Marketing site

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

Proprietary - All rights reserved.

## 🆘 Support

- GitHub Issues: [github.com/your-org/companionx/issues](https://github.com)
- Email: support@companionx.world
- Docs: [docs.companionx.world](https://docs.companionx.world)

---

**Built with ❤️ for FIFA World Cup 2026 in Mexico 🇲🇽⚽**
