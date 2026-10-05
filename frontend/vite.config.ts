import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Load .env from project root directory
  envDir: path.resolve(__dirname, ".."),
  server: {
    port: 5173,
    proxy: {
      "/cases": {
        target: "http://localhost:5000",
        changeOrigin: true,
        bypass: (req) => (req.headers.accept?.includes("text/html") ? "/index.html" : null),
      },
      "/evidence": {
        target: "http://localhost:5000",
        changeOrigin: true,
        bypass: (req) => (req.headers.accept?.includes("text/html") ? "/index.html" : null),
      },
      "/verification": {
        target: "http://localhost:5000",
        changeOrigin: true,
        bypass: (req) => (req.headers.accept?.includes("text/html") ? "/index.html" : null),
      },
      "/api-keys": {
        target: "http://localhost:5000",
        changeOrigin: true,
        bypass: (req) => (req.headers.accept?.includes("text/html") ? "/index.html" : null),
      },
      "/api": {
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
