import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale: 'es',
  localePrefix: 'always', // Always show locale in URL (e.g., /es, /en)
});

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files (_next/static, images, etc.)
  // - _next internal routes
  // - Special Next.js files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
