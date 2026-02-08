/**
 * 🛡️ SHADOW'S FORGE: DIAGNOSTIC GATE
 * ROLE: Verifies KV Bindings and Non-Embedded Environment Vitals.
 * STATUS: Optimized for Non-Embedded Testing.
 */
import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getEnv } from "../utils/env.server";
import { getKV } from "../shopify.server";

// ✅ CLINICAL FIX: Define local Env interface to clear Error 2339
interface Env {
  DEBUG_AUTH?: string;
  SHOPIFY_APP_URL?: string;
  EMBEDDED?: string; // Flag for non-embedded testing
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  // 1. SECURITY LOCKDOWN: Resolving typed environment
  const env = context.cloudflare.env as Env;
  const debugEnabled = env.DEBUG_AUTH === "true";

  if (!debugEnabled) {
    return json({ error: "DEBUG_AUTH is not enabled" }, { status: 403 });
  }

  let kvOk = false;
  let kvError: string | null = null;

  try {
    const kv = getKV(context);
    const key = `debug-auth:${Date.now()}`;
    await kv.put(key, "ok", { expirationTtl: 60 });
    const val = await kv.get(key);
    kvOk = val === "ok";
    await kv.delete(key);
  } catch (err: any) {
    kvError = err?.message || String(err);
  }

  // 2. NON-EMBEDDED VERIFICATION
  return json({
    appUrl: env.SHOPIFY_APP_URL || null,
    // Forces 'false' when EMBEDDED environment variable is strictly "false"
    embedded: env.EMBEDDED !== "false", 
    hasKvBinding: kvOk,
    kvError,
    host: request.headers.get("host"),
    shopDomain: request.headers.get("x-shopify-shop-domain"),
  });
};