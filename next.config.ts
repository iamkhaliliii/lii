import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
const isProd = process.env.NODE_ENV === "production";
const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  ...(isStaticExport && isProd && !isVercel ? { output: "export" as const } : {}),
};

export default nextConfig;
