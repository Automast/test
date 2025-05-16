import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Add API rewrite rules to proxy requests to your backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // WARNING: This 'localhost' destination will NOT work correctly when deployed to Vercel.
        // Vercel builds will run, but your deployed app's API calls using this rewrite will fail.
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '**',
      },
    ],
  },
  // Add this block to ignore TypeScript errors during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors. This should be a temporary measure.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
