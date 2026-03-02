import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Pockit",
        short_name: "Pockit",
        theme_color: "#6dd4b4",
        background_color: "#fafafa",
        display: "standalone",
        icons: [
          { src: "/pockit.png", sizes: "192x192", type: "image/png" },
          { src: "/pockit.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
