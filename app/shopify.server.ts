import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-07";
import db from "./db.server";
import type { AppLoadContext } from "@remix-run/cloudflare";

const shopify = shopifyApp({
  // 1. Edge Environment Variables
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SCOPES?.split(",") || ["read_products", "write_products", "write_content"],
  appUrl: process.env.SHOPIFY_APP_URL || "https://ironphoenixflow.com",
  authPathPrefix: "/auth",
  
  // 2. Persistent Truth Table Storage
  sessionStorage: new PrismaSessionStorage(db) as any,
  distribution: AppDistribution.AppStore,
  restResources,

  // 3. Clinical Webhook Routing
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app/uninstalled",
    },
    APP_SCOPES_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app/scopes_update",
    },
  },

  hooks: {
    afterAuth: async ({ session }) => {
      // Automatic skill registration on the Edge
      shopify.registerWebhooks({ session });
    },
  },

  // 4. Future-Proof Stability
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;

// ✅ NEW: Helper to access KV from context
export function getKV(context: AppLoadContext): KVNamespace {
  return context.cloudflare.env.KV_BINDING;
}

// ✅ NEW: Helper to get all Cloudflare bindings
export function getCloudflareEnv(context: AppLoadContext) {
  return context.cloudflare.env;
}