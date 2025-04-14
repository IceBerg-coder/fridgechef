/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enhanced configuration for Server Actions in GitHub Codespaces
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:9002',
        // Convert RegExp to string patterns
        'https://*-9002.app.github.dev',
        'https://*-9002.preview.app.github.dev',
        // Accept all origins in development
        ...(process.env.NODE_ENV === 'development' ? ['*'] : []),
      ],
    }
  },
};

module.exports = nextConfig;
