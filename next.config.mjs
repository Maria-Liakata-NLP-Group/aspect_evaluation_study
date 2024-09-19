/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  basePath: isProd ? "/nlp_reasoning_annotations" : "",
  assetPrefix: isProd ? "/nlp_reasoning_annotations/" : "",
  images: {
    unoptimized: true,
  },
  reactStrictMode: true, // Moved reactStrictMode inside the same config object
};

export default nextConfig;
