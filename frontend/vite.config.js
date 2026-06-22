import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,

    allowedHosts: [
      "baguette-dreamt-upbeat.ngrok-free.dev",
      ".ngrok-free.dev",
      ".ngrok-free.app"
    ],

    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true
      },
      "/admin": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true
      }
    }
  }
});
