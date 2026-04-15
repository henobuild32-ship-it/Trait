import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-0869a9a4-fb6d-4efa-9fff-a2bf58bf67a0.space.z.ai',
  ],
};

export default nextConfig;
