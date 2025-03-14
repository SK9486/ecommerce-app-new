import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Development port (matches FRONTEND_URL locally)
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:5000", // Use env variable or fallback
        changeOrigin: true, // Adjusts the host header to match the target
        secure: false, // Set to true if backend uses HTTPS in production
        rewrite: (path) => path.replace(/^\/api/, ""), // Optional: Strips "/api" prefix if needed
      },
    },
  },
  build: {
    outDir: "dist", // Output directory for production build
    sourcemap: false, // Disable sourcemaps in production for smaller builds
    minify: "esbuild", // Use esbuild for faster minification
    chunkSizeWarningLimit: 1600, // Adjust limit for larger vendor chunks
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"], // Optimize vendor bundle
        },
      },
    },
  },
  define: {
    // Expose environment variables to the client-side code
    "process.env.VITE_BACKEND_URL": JSON.stringify(
      process.env.VITE_BACKEND_URL || "http://localhost:5000"
    ),
    "process.env.VITE_FRONTEND_URL": JSON.stringify(
      process.env.VITE_FRONTEND_URL || "http://localhost:5173"
    ),
  },
});
