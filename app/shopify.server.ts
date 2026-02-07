function createShopify(env: Env) {
  return shopifyApp({
    // 1. Edge Environment Variables
    apiKey: env.SHOPIFY_API_KEY,
    apiSecretKey: env.SHOPIFY_API_SECRET,
    apiVersion: LATEST_API_VERSION,
    scopes: env.SCOPES?.split(",") || ["read_products", "write_products", "write_content"],
    
    // ✅ CLINICAL FIX: Match Cloudflare production domain
    appUrl: env.SHOPIFY_APP_URL || "https://ironphoenixflow.com", 
    authPathPrefix: "/auth",

    // ✅ EMBEDDED HANDSHAKE: Pulls engine into the Shopify Iframe
    isEmbeddedApp: true, 

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
        const shopify = getShopify();
        shopify.registerWebhooks({ session });
      },
    },

    future: {
      unstable_newEmbeddedAuthStrategy: true,
    },
  });
}