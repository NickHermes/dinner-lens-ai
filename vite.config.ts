import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use different base paths for development vs production
  let basePath = '/';
  
  if (mode === 'development') {
    basePath = '/'; // Local development
  } else {
    // Production builds - check if this is a development build by looking at the branch
    // We'll set this via environment variable in the GitHub Actions workflow
    const isDevBuild = process.env.VITE_IS_DEV_BUILD === 'true';
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
