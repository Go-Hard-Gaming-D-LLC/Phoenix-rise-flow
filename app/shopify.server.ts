/**
 * 🛡️ SHADOW'S FORGE: NEBULA SERVER CORE
 * ROLE: Standalone Workstation Handshake.
 * SYNC: 2026-02-07 21:12 PM
 */
import type { AppLoadContext } from "@remix-run/cloudflare";
import {
  AppDistribution,
  DeliveryMethod,
  LATEST_API_VERSION,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { restResources } from "@shopify/shopify-api/rest/admin/2025-07";
import { getEnv } from "./utils/env.server";
import { KvSessionStorage } from "./utils/kv-session-storage";

type ShopifyApp = ReturnType<typeof shopifyApp>;

let shopifyInstance: ShopifyApp | undefined;

function createShopify(): ShopifyApp {
  const env = getEnv();

  // ✅ CLINICAL LOCK: Explicitly set to false for Standalone Nebula Studio.
  // This resolves the 400 Bad Request error by disabling the Admin iframe logic.
  const isEmbedded = false;

  return shopifyApp({
    apiKey: env.SHOPIFY_API_KEY,
    apiSecretKey: env.SHOPIFY_API_SECRET,
    apiVersion: LATEST_API_VERSION,
    // 🛡️ SYNC: Locked to the extensive Rise diagnostic scopes.
    scopes: env.SCOPES?.split(",") || [
      "read_files",
      "write_files",
      "write_inventory",
      "read_inventory",
      "read_legal_policies",
      "read_locations",
      "read_online_store_navigation",
      "write_online_store_navigation",
      "read_products",
      "write_products",
      "read_content",
      "write_content",
      "read_themes",
      "write_themes"
    ],
    // 🛡️ SYNC: Points directly to your high-density workstation entry.
    appUrl: "https://ironphoenixflow.com/studio",
    authPathPrefix: "/auth",
    isEmbeddedApp: isEmbedded,
    sessionStorage: new KvSessionStorage(),
    distribution: AppDistribution.AppStore,
    restResources,
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
        const shopify = getShopify();
        await shopify.registerWebhooks({ session });
      },
    },
    future: {
      // ✅ LOCK: Must be false when isEmbeddedApp is false to prevent iframe auth loops.
      unstable_newEmbeddedAuthStrategy: false,
    },
  });
}

function getShopify(): ShopifyApp {
  if (!shopifyInstance) {
    shopifyInstance = createShopify();
  }
  return shopifyInstance;
}

const shopify = new Proxy({} as ShopifyApp, {
  get(_target, prop) {
    return (getShopify() as any)[prop];
  },
}) as ShopifyApp;

export default shopify;

export const authenticate = new Proxy({} as ShopifyApp["authenticate"], {
  get(_target, prop) {
    return (getShopify().authenticate as any)[prop];
  },
}) as ShopifyApp["authenticate"];

export const addDocumentResponseHeaders = (
  ...args: Parameters<ShopifyApp["addDocumentResponseHeaders"]>
) => {
  return getShopify().addDocumentResponseHeaders(...args);
};

export const login = (...args: Parameters<NonNullable<ShopifyApp["login"]>>) => {
  const loginFn = getShopify().login;
  if (!loginFn) {
    throw new Error("Shopify login is not enabled for this app distribution.");
  }
  return loginFn(...args);
};

export function getKV(context: AppLoadContext) {
  const env = getEnv(context);
  return env.SESSION_KV;
}