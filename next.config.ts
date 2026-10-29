import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/webhook": ["./lib/server/email-templates/purchase-confirmation-v1/**/*"],
  },
};

export default nextConfig;
