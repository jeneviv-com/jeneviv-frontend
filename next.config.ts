import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: "/app/:path*",
          destination: `${process.env.NEXT_PUBLIC_VITE_URL || "http://localhost:5173"}/app/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
