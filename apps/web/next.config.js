const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@companionx/db', '@companionx/utils'],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // PWA configuration
  headers: async () => [
    {
      source: '/manifest.webmanifest',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/manifest+json',
        },
      ],
    },
  ],
};

module.exports = withNextIntl(nextConfig);
