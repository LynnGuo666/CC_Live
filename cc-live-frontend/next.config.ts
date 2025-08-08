import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zh.minecraft.wiki',
      },
    ],
  },
};

export default nextConfig;
