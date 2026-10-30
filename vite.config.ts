import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { libInjectCss } from "vite-plugin-lib-inject-css";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    libInjectCss(),
    dts({
      include: ["src"],
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: "UIKit",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      // Исключаем React из бандла библиотеки
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        // Сохраняем директиву "use client" для Next.js App Router
        banner: '"use client";',
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
