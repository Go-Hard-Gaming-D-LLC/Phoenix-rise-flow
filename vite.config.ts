import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

export default defineConfig(({ mode }) => {
  // Check if we are running in production (Vercel)
  const isProduction = mode === "production";

  return {
    // 1. Server Config: Only exists locally. Vercel will see 'undefined' here.
    server: isProduction ? undefined : {
      port: 3000,
      host: "localhost",
      hmr: {
        protocol: "ws",
        host: "localhost",
      },
    },
    // 2. Plugins: Standard Remix setup
    plugins: [
      remix({
        ignoredRouteFiles: ["**/.*"],
        // This ensures Vercel builds to the correct relative folder
        buildDirectory: "build",
      }),
      tsconfigPaths(),
    ],
    // 3. Build: Optimization settings
    build: {
      assetsInlineLimit: 0,
    },
  };
});