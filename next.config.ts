import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mysql2'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
        port: '',
      },
    ],
  },
};

export default nextConfig;
