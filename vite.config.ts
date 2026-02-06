import { vitePlugin as remix, cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  // ✅ Shopify adapter alias for both client and SSR builds
  const shopifyAlias = {
    "@shopify/shopify-app-remix/adapters/web-api": 
      "@shopify/shopify-app-remix/dist/adapters/web-api/index.mjs",
  };

  return {
    server: isProduction ? undefined : {
      port: 3000,
      host: "localhost",
      hmr: {
        protocol: "ws",
        host: "localhost",
      },
    },
    resolve: {
      alias: shopifyAlias, // ✅ For client builds
    },
   plugins: [
      cloudflareDevProxyVitePlugin(), // ✅ MUST BE FIRST - before remix()
      remix({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true,
          v3_singleFetch: true,
        },
        ignoredRouteFiles: ["**/.*"],
      }),
      tsconfigPaths(),
    ],
    build: {
      minify: isProduction, // ✅ Enable minify in production
    },
    ssr: {
      noExternal: ["@shopify/shopify-app-remix"],
      resolve: {
        alias: shopifyAlias, // ✅ For SSR builds - CRITICAL FIX
        conditions: ["workerd", "worker", "browser"],
        externalConditions: ["workerd", "worker"],
      },
    }
  };
});