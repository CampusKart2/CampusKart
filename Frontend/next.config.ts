import type { NextConfig } from "next";
import { basePath } from "./lib/routes";

const nextConfig: NextConfig = {
  basePath,
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
