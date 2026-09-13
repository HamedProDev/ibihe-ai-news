import type { NextConfig } from 'next';

const extraDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Dev-only: allow proxied preview hosts (e.g. *.e2b.app) to load HMR assets.
  allowedDevOrigins: ['*.e2b.app', ...extraDevOrigins],
  // NOTE: no X-Frame-Options / frame-ancestors here on purpose — the page
  // must stay embeddable for preview environments. Revisit for production
  // hardening with a route-specific policy if clickjacking becomes a concern.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;
