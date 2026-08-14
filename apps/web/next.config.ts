import type { NextConfig } from "next";
import path from "node:path";

// Package-local env values keep precedence; the repository root .env fills the
// shared server variables documented by this monorepo.
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.resolve(process.cwd(), "../../.env"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

const nextConfig: NextConfig = {
  // 워크스페이스 패키지를 Next.js에서 사용할 수 있도록 변환
  transpilePackages: [
    "@project/shared",
    "@project/db",
    "@project/ai",
  ],

  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
