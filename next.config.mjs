const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  basePath: isProd ? "/nlp_reasoning_annotations" : "",
  assetPrefix: isProd ? "/nlp_reasoning_annotations/" : "",
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  output: "export", // This enables static export in Next.js 14+
};

export default nextConfig;
