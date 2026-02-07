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
  const isEmbedded = env.EMBEDDED !== "false";
  return shopifyApp({
    apiKey: env.SHOPIFY_API_KEY,
    apiSecretKey: env.SHOPIFY_API_SECRET,
    apiVersion: LATEST_API_VERSION,
    scopes: env.SCOPES?.split(",") || ["read_products", "write_products", "write_content"],
    appUrl: env.SHOPIFY_APP_URL || "https://ironphoenixflow.com",
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
      unstable_newEmbeddedAuthStrategy: true,
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
