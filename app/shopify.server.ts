import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION,
} from "@shopify/shopify-app-remix/server";
import { KvSessionStorage } from "./utils/kv-session-storage";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-07";
import type { AppLoadContext } from "@remix-run/cloudflare";
import type { Env } from "../load-context"; // Import Env type

type EnvContext = { cloudflare?: { env: Env } } | { env: Env };

declare global {
  // Set per-request in functions/[[path]].ts for Pages.
  var __CF_ENV: Env | undefined;
}

function resolveEnv(context?: EnvContext): Env {
  const env =
    (context as { cloudflare?: { env: Env } } | undefined)?.cloudflare?.env ??
    (context as { env?: Env } | undefined)?.env ??
    globalThis.__CF_ENV;

  if (!env) {
    throw new Error(
      "Missing Cloudflare env. Ensure bindings are available and set in Pages/Workers."
    );
  }

  return env;
}

function createShopify(env: Env) {
  const shopify = shopifyApp({
    // 1. Edge Environment Variables
    apiKey: env.SHOPIFY_API_KEY || "",
    apiSecretKey: env.SHOPIFY_API_SECRET || "",
    apiVersion: LATEST_API_VERSION,
    scopes: env.SCOPES?.split(",") || ["read_products", "write_products", "write_content"],
    appUrl: env.SHOPIFY_APP_URL || "https://ironphoenixflow.com",
    authPathPrefix: "/auth",

    // 2. Persistent Truth Table Storage
    sessionStorage: new KvSessionStorage(),
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

  return shopify;
}

let shopifySingleton: ReturnType<typeof shopifyApp> | undefined;

export function getShopify(context?: EnvContext) {
  if (!shopifySingleton) {
    shopifySingleton = createShopify(resolveEnv(context));
  }
  return shopifySingleton;
}

const shopifyProxy = new Proxy(
  {},
  {
    get(_target, prop) {
      return (getShopify() as any)[prop];
    },
  }
) as ReturnType<typeof shopifyApp>;

export default shopifyProxy;

export const authenticate = new Proxy(
  {},
  {
    get(_target, prop) {
      return (getShopify() as any).authenticate[prop];
    },
  }
) as ReturnType<typeof shopifyApp>["authenticate"];

export const unauthenticated = new Proxy(
  {},
  {
    get(_target, prop) {
      return (getShopify() as any).unauthenticated[prop];
    },
  }
) as ReturnType<typeof shopifyApp>["unauthenticated"];

export function login(request: Request) {
  return getShopify().login(request);
}

export function registerWebhooks(args: Parameters<ReturnType<typeof shopifyApp>["registerWebhooks"]>[0]) {
  return getShopify().registerWebhooks(args);
}

export function sessionStorage() {
  return getShopify().sessionStorage;
}

export function addDocumentResponseHeaders(request: Request, headers: Headers) {
  return getShopify().addDocumentResponseHeaders(request, headers);
}

//  Helper to access KV from context
export function getKV(context: AppLoadContext): KVNamespace {
  return context.cloudflare.env.SESSION_KV;
}

//  Helper to get all Cloudflare bindings
export function getCloudflareEnv(context: AppLoadContext): Env {
  return context.cloudflare.env;
}
