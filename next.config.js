/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "p16-sign-va.tiktokcdn.com" },
      { protocol: "https", hostname: "p77-sign-va.tiktokcdn.com" },
      { protocol: "https", hostname: "*.tiktokcdn.com" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk"],
  },
  // Ignore test files during build
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), "vitest"];
    return config;
  },
};

module.exports = nextConfig;
