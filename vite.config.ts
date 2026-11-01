import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      {
        name: "production-content-policy",
        transformIndexHtml(html) {
          return command === "build"
            ? html.replace(" ws://127.0.0.1:* ws://localhost:*", "")
            : html;
        },
      },
    ],
    server: {
      host: "127.0.0.1",
      port: 5173,
      proxy: {
        "/api": {
          target: env.API_PROXY_TARGET || "http://127.0.0.1:8000",
          changeOrigin: false,
        },
      },
    },
  };
});
