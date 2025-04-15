/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' for Vercel deployment to enable server features
  // output: 'export',
  
  // Remove basePath for Vercel deployment
  // basePath: process.env.NODE_ENV === 'production' ? '/fridgechef' : '',
  
  images: {
    // Remove unoptimized: true as Vercel handles image optimization
    // unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable server actions for Vercel deployment
  experimental: {
    // Server Actions have been updated in Next.js 15.x
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:9002', '.app.github.dev'],
    },
  },
  // Remove trailingSlash setting which is for static exports
  // trailingSlash: true,
  
  // Add redirects and rewrites that work with Vercel
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
