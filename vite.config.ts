
{/* 
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

*/}



import { defineConfig } from 'vite';
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    },
    host: 'localhost',
    port: 5173,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Make sure environment variables are properly defined
  define: {
    // Ensure backward compatibility by exposing process.env 
    // This is helpful during transition from process.env to import.meta.env
    'process.env': {}
  },
});

