import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// Treat .geojson files as JSON modules (Vite only handles .json natively)
const geojsonPlugin: Plugin = {
  name: 'vite-plugin-geojson',
  transform(src, id) {
    if (id.endsWith('.geojson')) {
      return { code: `export default ${src}`, map: null };
    }
  },
};

export default defineConfig({
  plugins: [geojsonPlugin, react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
