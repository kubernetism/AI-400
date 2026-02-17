import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable React Strict Mode for development
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable Partial Prerendering when stable
    // ppr: true,

    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

export default nextConfig
