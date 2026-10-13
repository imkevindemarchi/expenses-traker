import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
const proxy = { "/api": { target: "http://127.0.0.1:4000" } };
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: "0.0.0.0", port: 3000, strictPort: true, proxy },
  preview: { host: "0.0.0.0", port: 4100, strictPort: true, proxy },
});
