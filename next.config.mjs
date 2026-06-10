/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: import.meta.dirname,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // firebase-admin uses native/dynamic requires — keep it external so Next
  // requires it at runtime instead of bundling it into server chunks.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
