// vite.config.ts
import { defineConfig, loadEnv } from "vite"; // Added loadEnv
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env file variables based on the current mode (development/production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::", // Listen on all network interfaces (IPv4 and IPv6)
      port: 8080,
      headers: {
        // Required for SharedArrayBuffer used by some libraries (like Mapbox GL JS workers or certain WASM scenarios)
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      // Optional: If mapbox-gl workers need specific fs access (unlikely for standard use)
      // fs: {
      //   allow: ['..']
      // }
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            // Copy ONNX Runtime WASM files to the output root directory
            // Ensure this path is correct relative to your project root
            src: 'node_modules/onnxruntime-web/dist/*.wasm',
            dest: '.' // Copies to the root of the build output (e.g., dist/)
          },
          {
            // Copy the GeoJSON file to the output root directory
            // Ensure 'public/india_states.geojson' exists.
            src: 'public/india_states.geojson',
            dest: '.' // Copies to the root of the build output (e.g., dist/india_states.geojson)
          }
        ],
        // Optional: Set to true if you want to see logs from this plugin
        // verbose: true,
      })
    ],
    resolve: {
      alias: {
        // Standard alias for cleaner imports from the 'src' directory
        "@": path.resolve(__dirname, "./src"),
        // Keep this alias ONLY if you have this specific shim file and need it. Verify path.
        'use-sync-external-store/shim/with-selector': path.resolve(__dirname, './src/lib/use-sync-external-store-shim.js'),
        // Add alias for react-map-gl to resolve the "Missing ." specifier error
        // Pointing to the mapbox.js distribution file
        'react-map-gl': path.resolve(__dirname, './node_modules/react-map-gl/dist/mapbox.js'),
      },
    },
    optimizeDeps: {
      // Help Vite pre-bundle these dependencies for faster cold starts
      include: [
          'react-map-gl',
          'mapbox-gl',
          // Add other large or common dependencies if needed
      ],
      // Exclude packages that have their own loading mechanisms or cause issues with pre-bundling
      exclude: [
          'onnxruntime-web',
          // '@react-three/fiber', // Uncomment if using and needed
          // '@react-three/drei'   // Uncomment if using and needed
      ],
      esbuildOptions: {
        // Standard settings, usually don't need changes
        resolveExtensions: ['.js', '.jsx', '.ts', '.tsx'],
        mainFields: ['module', 'main']
      }
    },
    // Ensure Vite includes these file types when resolving assets
    assetsInclude: ['**/*.onnx', '**/*.gltf', '**/*.bin', '**/*.glb', '**/*.geojson'],
    build: {
      rollupOptions: {
        output: {
          // Customize how assets are named and placed in the build output
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.wasm')) {
              // Place WASM files in a dedicated folder within assets
              return 'assets/wasm/[name]-[hash][extname]';
            }
            if (assetInfo.name?.endsWith('.geojson')) {
              // Place GeoJSON file directly in the output root (matches fetch path '/')
              return '[name][extname]'; // e.g., 'india_states.geojson'
            }
            // Default asset naming convention
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      // Optional: Increase warning limit if needed for large assets
      // chunkSizeWarningLimit: 1000,
    },
    // Define global constants replacements. Crucial for environment variables.
    define: {
      // Pass the Mapbox token from your .env file to the client-side code
      // The key MUST match how you access it in your code (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN)
      'import.meta.env.VITE_MAPBOX_ACCESS_TOKEN': JSON.stringify(env.VITE_MAPBOX_ACCESS_TOKEN || ""),

      // --- Avoid defining process.env directly unless absolutely necessary ---
      // Some older libraries *might* still check process.env.NODE_ENV. If you encounter issues:
      // 'process.env.NODE_ENV': JSON.stringify(mode),
      // Generally, prefer using import.meta.env provided by Vite.
    },
    // Configuration for web workers, often needed by mapbox-gl
    worker: {
      // Use ES module format for workers for better compatibility with Vite
      format: 'es',
      // You might need to configure plugins for workers if they use specific Vite features
      // plugins: () => [react()] // Example if worker needs React
    }
  };
});