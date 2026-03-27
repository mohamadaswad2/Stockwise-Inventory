/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for Vercel deployment
  output: 'standalone',
  // Allow images from any HTTPS source
  images: {
    domains: [],
    unoptimized: true,
  },
  // Ensure env var is available client-side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};
module.exports = nextConfig;
