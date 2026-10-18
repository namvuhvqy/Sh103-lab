import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**/*": ["./docs/danh mục biểu mẫu/**/*", "./public/templates/**/*"],
  },
};

export default nextConfig;
