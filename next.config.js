/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // `images.domains` is deprecated in Next.js 14 — every host it used to allow
  // is expressed as a remotePattern below. Omitting `port` matches any port,
  // which is what `domains` did for the local dev hosts.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**'
      }
    ]
  },
  // Strip console.log/warn/debug from production bundles but keep console.error
  // so real failures still surface in production logs.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
