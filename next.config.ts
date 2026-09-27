import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(process.cwd()),
  async redirects() {
    return [
      {
        source: "/splash",
        destination: "/",
        permanent: false,
      },
      {
        source: "/onboarding",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
