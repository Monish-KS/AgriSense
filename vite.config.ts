import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { viteStaticCopy } from 'vite-plugin-static-copy'; // Import the plugin

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Optional: Add headers to ensure correct MIME type for wasm files during development
    // headers: {
    //   'Cross-Origin-Embedder-Policy': 'require-corp',
    //   'Cross-Origin-Opener-Policy': 'same-origin',
    // }
  },
  plugins: [
    react(),
    // Add the viteStaticCopy plugin configuration
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm', // Source WASM files
          dest: 'public' // Destination directory (copy to public for dev server)
        }
      ]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optional: Optimize dependencies if needed
  // optimizeDeps: {
  //   exclude: ['onnxruntime-web']
  // }
}));
