import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

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
      remix({
        ignoredRouteFiles: ["**/.*"],
        buildDirectory: "build",
        serverBuildFile: "index.js",
      }),
      tsconfigPaths(),
    ],

    build: {
      assetsInlineLimit: 0,
    },
  };
});