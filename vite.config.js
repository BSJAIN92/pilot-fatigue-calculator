import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: resolve(import.meta.dirname, "index.html"),
        analytics: resolve(import.meta.dirname, "analytics.html"),
      },
    },
  },
});
