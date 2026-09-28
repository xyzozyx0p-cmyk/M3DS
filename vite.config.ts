import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js сам по себе больше 500 кБ — это ожидаемо для 3D-сцены.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // three.js весит больше остального приложения вместе взятого,
        // поэтому выносим его и React в отдельные чанки.
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT ?? 5173),
    strictPort: false,
    hmr: false,
  },
});
