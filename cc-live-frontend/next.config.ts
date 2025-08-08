import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zh.minecraft.wiki',
      },
      {
        protocol: 'https',
        hostname: 'minecraft.wiki',
      },
      {
        protocol: 'https',
        hostname: 'minecraftitemids.com',
      },
      {
        protocol: 'https',
        hostname: 'static.wikia.nocookie.net',
      },
    ],
  },
};

export default nextConfig;
