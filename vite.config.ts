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
    // Configure proper MIME types for WebAssembly files
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
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
      // Add an alias to fix the use-sync-external-store import issue
      'use-sync-external-store/shim/with-selector': path.resolve(__dirname, './src/lib/use-sync-external-store-shim.js')
    },
  },
  // Optional: Optimize dependencies if needed
  optimizeDeps: {
    include: [],
    exclude: ['onnxruntime-web', '@react-three/fiber', '@react-three/drei'],
    esbuildOptions: {
      // Properly handle use-sync-external-store package
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx'],
      mainFields: ['module', 'main']
    }
  },
  // Configure static file handling and MIME types
  assetsInclude: ['**/*.onnx'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Ensure WebAssembly files keep their extension and are served with correct MIME type
          if (assetInfo && assetInfo.name && assetInfo.name.endsWith('.wasm')) {
            return 'assets/wasm/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
  },
}));
