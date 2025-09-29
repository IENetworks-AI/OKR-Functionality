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
      "/api/chat": {
        target: "https://172.20.30.72",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, "/chat"),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
        },
      },
      "/api/weekly-plan": {
        target: "https://172.20.30.72",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/weekly-plan/, "/weekly-plan"),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
        },
      },
      "/api/daily-plan": {
        target: "https://172.20.30.72",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/daily-plan/, "/daily-plan"),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
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