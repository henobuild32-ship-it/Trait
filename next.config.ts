import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    'preview-chat-0869a9a4-fb6d-4efa-9fff-a2bf58bf67a0.space-z.ai',
    '*.space-z.ai',
  ],
};

export default nextConfig;
