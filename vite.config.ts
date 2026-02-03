import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2018",
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
          stripe: ["@stripe/react-stripe-js", "@stripe/stripe-js"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
