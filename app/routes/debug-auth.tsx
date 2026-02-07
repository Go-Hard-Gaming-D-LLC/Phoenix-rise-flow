import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getEnv } from "../utils/env.server";
import { getKV } from "../shopify.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = getEnv(context);
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

  return json({
    appUrl: env.SHOPIFY_APP_URL || null,
    embedded: env.EMBEDDED !== "false",
    hasKvBinding: kvOk,
    kvError,
    host: request.headers.get("host"),
    shopDomain: request.headers.get("x-shopify-shop-domain"),
  });
};
