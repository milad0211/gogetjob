import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist and pdf-parse must NOT be bundled by Turbopack.
  // They use browser-like module patterns that break when Turbopack
  // processes them into server chunks (Object.defineProperty errors).
  serverExternalPackages: ['pdfjs-dist', 'pdf-parse'],
};

export default nextConfig;
