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
      // ✅ NO-EXTERNAL: Forces bundling of Shopify for the Cloudflare Edge
      noExternal: ["@shopify/shopify-app-remix"],
      resolve: {
        conditions: ["workerd", "worker", "browser"],
        externalConditions: ["workerd", "worker"],
      },
    }
  };
});
