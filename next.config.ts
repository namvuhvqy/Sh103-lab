import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./docs/danh mục biểu mẫu/**/*", "./public/templates/**/*"],
  },
};

export default nextConfig;
