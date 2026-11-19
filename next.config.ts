import type { NextConfig } from "next";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const config: NextConfig = {
  // Static export for GitHub Pages (NEXT_EXPORT=1); plain server build otherwise (Vercel).
  ...(process.env.NEXT_EXPORT ? { output: "export" as const } : {}),
  basePath: base || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  // Tailwind v4 via Turbopack: do not remove, utilities silently disappear.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default config;
