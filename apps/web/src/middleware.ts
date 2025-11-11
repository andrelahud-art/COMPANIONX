import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale: 'es',
  localePrefix: 'as-needed',
});

export const config = {
  matcher: ['/', '/(es|en)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
};
