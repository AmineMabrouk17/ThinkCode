import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // YouTube thumbnails for the RESOURCES section. The `Image` usage is
    // `unoptimized` (see `components/resources/youtube-player.tsx`) because the
    // Workers runtime has no image optimizer behind `/_next/image`, but the
    // pattern is declared anyway so the allow-list stays honest if that changes.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/vi/**",
      },
    ],
  },
};

export default nextConfig;

// Integrates the local Next.js dev server with the Cloudflare platform proxy
// (provides bindings such as D1 via wrangler during `next dev`).
import("@opennextjs/cloudflare").then((m) =>
  m.initOpenNextCloudflareForDev()
);
