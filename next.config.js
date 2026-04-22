/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'p16-sign-va.tiktokcdn.com' },
      { protocol: 'https', hostname: 'p77-sign-va.tiktokcdn.com' },
      { protocol: 'https', hostname: '*.tiktokcdn.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
}

module.exports = nextConfig
