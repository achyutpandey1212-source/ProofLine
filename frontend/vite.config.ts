import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // Load .env from project root directory
  envDir: path.resolve(__dirname, ".."),
  server: {
    port: 5173,
    proxy: {
      "/cases": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/evidence": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/verification": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
