import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { normalizeApiBase } from "./src/api/urls.ts";
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase = normalizeApiBase(env.VITE_API_BASE);
  const apiOrigin =
    apiBase.startsWith("https://") || apiBase.startsWith("http://")
      ? ` ${new URL(apiBase).origin}`
      : "";
  if (env.VERCEL_ENV === "production" && !apiBase.startsWith("https://"))
    throw new Error(
      "Set VITE_API_BASE to the HTTPS backend API URL before deploying to Vercel.",
    );
  return {
    plugins: [
      react(),
      {
        name: "production-content-policy",
        transformIndexHtml(html) {
          html = html.replace(
            "connect-src 'self'",
            `connect-src 'self'${apiOrigin}`,
          );
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
