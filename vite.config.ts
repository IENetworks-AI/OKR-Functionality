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
        target: "http://139.185.33.139",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, "/chat"),
      },
      "/api/weekly-plan": {
        target: "http://139.185.33.139",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/weekly-plan/, "/weekly-plan"),
      },
      "/api/daily-plan": {
        target: "http://139.185.33.139",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/daily-plan/, "/daily-plan"),
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