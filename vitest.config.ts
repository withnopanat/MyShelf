import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true, // ให้ @testing-library/react auto-cleanup ระหว่าง test
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
