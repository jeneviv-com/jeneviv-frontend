import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CSS and PostCSS are handled automatically by Next.js
  // Make sure postcss.config.js and tailwind.config.ts are present
  webpack: (config) => {
    // Ensure CSS modules and regular CSS are handled properly
    return config;
  },
};

export default nextConfig;
