import { vitePlugin as remix, cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  const shopifyAlias = {
    "@shopify/shopify-app-remix/adapters/web-api":
      "@shopify/shopify-app-remix/dist/adapters/web-api/index.mjs",
  };

  const plugins = [
    cloudflareDevProxyVitePlugin(),
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
  ];

  return {
    server: isProduction
      ? undefined
      : {
          port: 3000,
          host: "localhost",
          hmr: {
            protocol: "ws",
            host: "localhost",
          },
        },
    resolve: {
      alias: shopifyAlias,
    },
    plugins,
    build: {
      minify: isProduction,
    },
    ssr: {
      noExternal: ["@shopify/shopify-app-remix"],
      resolve: {
        alias: shopifyAlias,
        conditions: ["workerd", "worker", "browser"],
        externalConditions: ["workerd", "worker"],
      },
    },
  };
});
