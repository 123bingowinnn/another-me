import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" 让构建产物用相对路径，可直接部署到任意子路径或静态托管
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../../../compare-demon",
    emptyOutDir: true,
  },
});
