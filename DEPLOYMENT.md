# CompanionX World 2026 - Deployment Guide

This guide walks you through deploying CompanionX to production.

## Prerequisites Checklist

- [ ] Vercel account
- [ ] Supabase project created
- [ ] OpenAI API key
- [ ] Stripe account (test + production keys)
- [ ] Resend account for emails
- [ ] Domain configured (optional)

## Step-by-Step Deployment

### 1. Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose region closest to your users (Mexico for this project)
   - Save your project credentials

2. **Enable pgvector**
   ```sql
   -- In SQL Editor
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Configure Database**
   ```bash
   # Set DATABASE_URL in your local .env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

   # Run migrations
   cd packages/db
   pnpm prisma migrate deploy
   ```

4. **Apply RLS Policies**
   - Open Supabase SQL Editor
   - Copy contents of `packages/db/prisma/rls-policies.sql`
   - Execute

5. **Configure Auth**
   - Go to Authentication → Settings
   - Enable Email provider
   - Configure email templates (optional)
   - Set Site URL to your production domain

6. **Create Storage Buckets**
   ```sql
   -- In SQL Editor or via Dashboard
   INSERT INTO storage.buckets (id, name, public)
   VALUES
     ('avatars', 'avatars', true),
     ('kyc-documents', 'kyc-documents', false);

   -- RLS policies for avatars (public read)
   CREATE POLICY "Public avatars are publicly accessible"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'avatars');

   CREATE POLICY "Users can upload own avatar"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'avatars'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );

   -- RLS policies for KYC (private)
   CREATE POLICY "Users can view own KYC documents"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'kyc-documents'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );

   CREATE POLICY "Users can upload own KYC documents"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'kyc-documents'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

### 2. Stripe Setup

1. **Get API Keys**
   - Go to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   - Copy Publishable key and Secret key
   - Save both test and production keys

2. **Enable Stripe Connect**
   - Go to Connect → Settings
   - Choose "Standard" account type
   - Configure branding and policies
   - Save Connect Client ID

3. **Configure Webhooks**
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `account.updated`
   - Copy webhook signing secret

### 3. Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial CompanionX setup"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework Preset: **Next.js**
   - Root Directory: `apps/web`
   - Override settings:
     - Build Command: `cd ../.. && pnpm build --filter=@companionx/web`
     - Install Command: `cd ../.. && pnpm install`

3. **Configure Environment Variables**

   Add all variables from `.env.example`:

   ```env
   # Site
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

   # Database
   DATABASE_URL=postgresql://postgres:...

   # OpenAI
   OPENAI_API_KEY=sk-...

   # Stripe
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_CONNECT_CLIENT_ID=ca_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

   # Email
   RESEND_API_KEY=re_...

   # Sentry
   SENTRY_DSN=https://...
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your production URL

### 4. Post-Deployment

1. **Seed Production Data** (Optional)
   ```bash
   # Use seed script or manually add initial companions
   DATABASE_URL="your-production-url" pnpm db:seed
   ```

2. **Test Critical Flows**
   - [ ] User registration (visitor + companion)
   - [ ] Search and matching
   - [ ] Booking creation
   - [ ] Stripe payment
   - [ ] Chat functionality
   - [ ] PWA installation (iOS/Android)

3. **Configure Domain** (Optional)
   - Add custom domain in Vercel
   - Update DNS records
   - Update `NEXT_PUBLIC_SITE_URL`
   - Update Supabase Site URL

4. **Set up Monitoring**
   - Configure Sentry alerts
   - Set up Vercel Analytics
   - Monitor Supabase metrics

### 5. Stripe Connect Onboarding

For each companion to receive payouts:

1. **Create Connect Account**
   ```typescript
   const account = await stripe.accounts.create({
     type: 'standard',
   });
   ```

2. **Generate Onboarding Link**
   ```typescript
   const accountLink = await stripe.accountLinks.create({
     account: account.id,
     refresh_url: 'https://your-domain.com/companion/onboarding',
     return_url: 'https://your-domain.com/companion/dashboard',
     type: 'account_onboarding',
   });
   ```

3. **Companion completes onboarding** via Stripe-hosted flow

## Environment-Specific Notes

### Development
- Use Stripe test keys
- Use test Supabase project
- Seed with fake data

### Staging
- Use Stripe test keys
- Use production Supabase (with staging data)
- Test full payment flow

### Production
- Use Stripe live keys
- Use production Supabase
- Enable RLS
- Monitor errors via Sentry

## Rollback Plan

If deployment fails:

1. Revert to previous deployment in Vercel
2. Check database migration status
3. Review error logs in Sentry
4. Verify environment variables

## Support

For deployment issues:
- Check [Vercel docs](https://vercel.com/docs)
- Check [Supabase docs](https://supabase.com/docs)
- Open GitHub issue with logs

---

**Next Steps**: Once deployed, proceed with companion onboarding in CDMX, GDL, and MTY!
