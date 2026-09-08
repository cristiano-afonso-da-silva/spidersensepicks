import type { NextConfig } from "next";
import path from "path";

/** Project Pages live under /spidersensepicks — keep empty for plain local preview via BASE_PATH= */
const basePath = process.env.BASE_PATH ?? "/spidersensepicks";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
