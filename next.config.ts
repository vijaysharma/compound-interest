import type { NextConfig } from 'next';
import path from 'node:path';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'src/styles')],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'checkout.razorpay.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/emi', destination: '/emi-calculator', permanent: true },
      { source: '/deposits/fd', destination: '/fd-calculator', permanent: true },
      { source: '/deposits/rd', destination: '/rd-calculator', permanent: true },
      { source: '/deposits/ppf', destination: '/ppf-calculator', permanent: true },
      { source: '/fixed-plans/fixed-rate-sip', destination: '/sip-calculator', permanent: true },
      { source: '/fixed-plans/fixed-rate-swp', destination: '/swp-calculator', permanent: true },
      { source: '/fixed-plans/ppf', destination: '/ppf-calculator', permanent: true },
      { source: '/fixed-plans/nps', destination: '/nps-calculator', permanent: true },
      { source: '/tax/income-tax', destination: '/income-tax-calculator', permanent: true },
      { source: '/tax-calculator', destination: '/income-tax-calculator', permanent: true },
      { source: '/economics/inflation-rates', destination: '/inflation-calculator', permanent: true },
      { source: '/economics/ppp-exchange-rate', destination: '/ppp-calculator', permanent: true },
      { source: '/economics/currency-converter', destination: '/currency-converter', permanent: true },
      { source: '/utilities/currency-converter', destination: '/currency-converter', permanent: true },
      { source: '/compound-interest-calculator', destination: '/fd-calculator', permanent: true },
      { source: '/admin/quick-notes', destination: '/utilities/quick-notes', permanent: true },
      { source: '/admin/notes', destination: '/utilities/quick-notes', permanent: true },
      { source: '/notes', destination: '/utilities/quick-notes', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://accounts.google.com; img-src 'self' data: blob: https://api.dicebear.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://checkout.razorpay.com; font-src 'self' data:; connect-src 'self' https://open.er-api.com https://api.mfapi.in https://api.worldbank.org https://oauth2.googleapis.com https://accounts.google.com https://api.razorpay.com https://lumberjack.razorpay.com https://apiv2.shiprocket.in https://api.postalpincode.in; frame-src 'self' https://accounts.google.com https://api.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
      {
        source: '/(.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};
export default nextConfig;
