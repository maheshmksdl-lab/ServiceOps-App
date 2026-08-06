import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "@phosphor-icons/react",
      "recharts",
      "@mui/material",
      "@mui/icons-material",
    ],
  },
};

export default nextConfig;
