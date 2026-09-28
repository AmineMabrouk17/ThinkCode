import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Integrates the local Next.js dev server with the Cloudflare platform proxy
// (provides bindings such as D1 via wrangler during `next dev`).
import("@opennextjs/cloudflare").then((m) =>
  m.initOpenNextCloudflareForDev()
);