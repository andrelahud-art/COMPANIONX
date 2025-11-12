'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Shield, MapPin, CreditCard } from 'lucide-react';

export default function LandingPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">CompanionX</div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">{t('auth.signIn')}</Button>
            </Link>
            <Link href="/auth/register">
              <Button>{t('auth.signUp')}</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl md:text-7xl">
          {t('landing.hero.title')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          {t('landing.hero.subtitle')}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/onboarding/visitor">
            <GradientButton className="text-lg px-8 py-6">
              {t('landing.hero.ctaVisitor')}
            </GradientButton>
          </Link>
          <Link href="/onboarding/companion">
            <GradientButton variant="variant" className="text-lg px-8 py-6">
              {t('landing.hero.ctaCompanion')}
            </GradientButton>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span>ID Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span>AI-Powered Matching</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
          {t('landing.features.title')}
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t('landing.features.aiMatching.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('landing.features.aiMatching.description')}</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t('landing.features.verified.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('landing.features.verified.description')}</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t('landing.features.local.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('landing.features.local.description')}</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CreditCard className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t('landing.features.secure.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('landing.features.secure.description')}</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FIFA 2026 Cities */}
      <section className="bg-blue-50 dark:bg-gray-800 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-4">
            FIFA World Cup 2026 - Mexico Host Cities
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
            Companions available in all major host cities
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Ciudad de México', 'Guadalajara', 'Monterrey'].map((city) => (
              <div
                key={city}
                className="bg-white dark:bg-gray-700 rounded-lg px-6 py-3 shadow-sm font-medium"
              >
                {city}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>© 2026 CompanionX World. All rights reserved.</p>
        <div className="mt-4 flex justify-center gap-6">
          <a href="#" className="hover:text-primary">
            Terms
          </a>
          <a href="#" className="hover:text-primary">
            Privacy
          </a>
          <a href="#" className="hover:text-primary">
            Safety
          </a>
        </div>
      </footer>
    </div>
  );
}
