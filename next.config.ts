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
    serverActions: true, // Enable server actions for Vercel
  },
  // Remove trailingSlash setting which is for static exports
  // trailingSlash: true,
  
  // Add redirects and rewrites that work with Vercel
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
