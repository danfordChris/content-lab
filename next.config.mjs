/** @type {import('next').NextConfig} */
const FIREBASE_AUTH_HOST = "danfordchris-content-lab.firebaseapp.com";

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: import.meta.dirname,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // firebase-admin uses native/dynamic requires — keep it external so Next
  // requires it at runtime instead of bundling it into server chunks.
  serverExternalPackages: ["firebase-admin"],
  // Serve Firebase's auth helper from our own domain so the Google consent
  // screen shows contentlab.danfordchris.dev instead of *.firebaseapp.com.
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${FIREBASE_AUTH_HOST}/__/auth/:path*`,
      },
      {
        source: "/__/firebase/:path*",
        destination: `https://${FIREBASE_AUTH_HOST}/__/firebase/:path*`,
      },
    ];
  },
};

export default nextConfig;
