import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/landing",
        destination: "https://prompt-nivvo.vercel.app/landing",
      },
      {
        source: "/admin/:path*",
        destination: "https://prompt-nivvo.vercel.app/admin/:path*",
      },
    ];
  },
};

export default nextConfig;