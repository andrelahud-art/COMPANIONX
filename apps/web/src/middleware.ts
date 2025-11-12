import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale: 'es',
  localePrefix: 'as-needed',
});

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files (_next/static, images, etc.)
  // - _next internal routes
  // - Special Next.js files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
