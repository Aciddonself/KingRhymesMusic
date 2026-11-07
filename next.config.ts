import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep standalone packaging for Docker by default. Hosts that run `next start`
  // or use the Netlify adapter must use Next.js's default output mode.
  output: process.env.NEXT_OUTPUT === "default" ? undefined : "standalone",
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/pics/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
