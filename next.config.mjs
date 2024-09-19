/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

module.exports = {
  basePath: isProd ? "/nlp_reasoning_annotations/" : "",
  assetPrefix: isProd ? "/nlp_reasoning_annotations/" : "",
  images: {
    unoptimized: true,
  },
};

const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
