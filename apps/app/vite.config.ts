import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind IPv4 loopback explicitly. Vite can otherwise listen on IPv6 [::1],
    // which the IPv4-targeting Portless proxy can't reach (-> 502).
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
});
