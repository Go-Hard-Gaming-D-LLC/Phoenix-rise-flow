import { vitePlugin as remix, cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    server: isProduction ? undefined : {
      port: 3000,
      host: "localhost",
      hmr: {
        protocol: "ws",
        host: "localhost",
      },
    },
    // ✅ CLINICAL RESOLUTION: Force-map the adapter to its dist file
    resolve: {
      alias: {
        "@shopify/shopify-app-remix/adapters/web-api": 
          "node_modules/@shopify/shopify-app-remix/dist/adapters/web-api/index.js",
      },
    },
    plugins: [
      cloudflareDevProxyVitePlugin(),
      remix({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true, // v7 compatibility
          v3_singleFetch: true, // v7 compatibility
        },
        ignoredRouteFiles: ["**/.*"],
      }),
      tsconfigPaths(),
    ],
    build: {
      minify: false,
    },
    ssr: {
      // ✅ NO-EXTERNAL: Bundles the package for the Edge
      noExternal: ["@shopify/shopify-app-remix"],
      resolve: {
        conditions: ["workerd", "worker", "browser"],
        externalConditions: ["workerd", "worker"],
      },
    }
  };
});