import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    cors: true,
    proxy: {
      "/api/okr-suggest": {
        target: "http://localhost:8082", // Netlify dev server port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/okr-suggest/, "/.netlify/functions/okr-suggest"),
      },
      "/api/backend": {
        target: "http://172.20.30.72",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/backend/, ""),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Remove the ngrok header since we're not using ngrok anymore
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));