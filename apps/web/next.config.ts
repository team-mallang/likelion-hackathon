import type { NextConfig } from "next";

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
