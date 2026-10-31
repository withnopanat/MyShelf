import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ปิด cacheComponents: ทุกหน้าอ่าน session จาก database (Auth.js) จึง prerender ตอน build ไม่ได้
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
