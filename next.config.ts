import type { NextConfig } from "next";

// Set BACKEND_URL (e.g. http://127.0.0.1:8000) to connect the FastAPI backend; without it the app runs offline.
const backend = process.env.BACKEND_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // pin the workspace root so a stray lockfile in a parent folder is never picked up
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  async rewrites() {
    return backend ? [{ source: "/backend/:path*", destination: `${backend}/:path*` }] : [];
  },
};

export default nextConfig;
