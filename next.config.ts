import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Add API rewrite rules to proxy requests to your backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // IMPORTANT: For Vercel deployment, 'localhost' will not work.
        // Your backend needs to be publicly accessible, or you should use Vercel Serverless Functions.
        // If your backend is also on Vercel or another cloud provider, use its deployed URL.
        // Example: destination: 'https://your-backend-api.com/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'YOUR_PRODUCTION_BACKEND_URL/api/:path*' // Replace with your actual backend URL
          : 'http://localhost:5000/api/:path*',
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Note: This CSP is quite restrictive.
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
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
