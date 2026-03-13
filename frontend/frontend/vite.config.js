import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://localhost:5000",
      "/users": "http://localhost:5000",
      "/conversations": "http://localhost:5000",
      "/messages": "http://localhost:5000",
      "/groups": "http://localhost:5000",
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
});
