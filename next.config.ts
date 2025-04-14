/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // For deployment to GitHub Pages, set the basePath to match your repository name
  // For example if your repo is username/fridgechef, use:
  basePath: process.env.NODE_ENV === 'production' ? '/fridgechef' : '',
  // Required for GitHub Pages
  images: {
    unoptimized: true,
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
  // Enhanced configuration for Server Actions in GitHub Codespaces
  experimental: {
    serverActions: false, // Disable server actions for static export
  },
  // Ensure dynamic routes are generated as static pages
  trailingSlash: true,
  // Add redirects and rewrites that work with static export
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
