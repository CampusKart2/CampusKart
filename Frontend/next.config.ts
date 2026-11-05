import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/campuskart",
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
};

export default nextConfig;
