import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@project/shared", "@project/db"],

  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
