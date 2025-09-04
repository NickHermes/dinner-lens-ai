import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determine base path based on environment
  let basePath = '/';
  
  if (mode === 'production') {
    // Check if this is a development build by looking at environment variables
    const isDevBuild = process.env.VITE_SUPABASE_URL?.includes('bvzclxdppwpayawrnrkz');
    basePath = isDevBuild ? '/dinner-lens-ai-dev/' : '/dinner-lens-ai/';
  }
  
  return {
    base: basePath,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
