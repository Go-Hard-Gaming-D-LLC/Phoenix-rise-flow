// utils/kv-helpers.ts
import type { AppLoadContext } from "@remix-run/cloudflare";
import { getKV } from "~/shopify.server";

export async function getShopSettings(context: AppLoadContext, shop: string) {
  const kv = getKV(context);
  const settings = await kv.get(`shop:${shop}:settings`);
  return settings ? JSON.parse(settings) : null;
}

export async function setShopSettings(
  context: AppLoadContext, 
  shop: string, 
  settings: any
) {
  const kv = getKV(context);
  await kv.put(`shop:${shop}:settings`, JSON.stringify(settings));
}

export async function cacheShopData(
  context: AppLoadContext,
  shop: string,
  key: string,
  data: any,
  ttl: number = 3600
) {
  const kv = getKV(context);
  await kv.put(
    `shop:${shop}:${key}`,
    JSON.stringify(data),
    { expirationTtl: ttl }
  );
}

export async function getCachedShopData(
  context: AppLoadContext,
  shop: string,
  key: string
) {
  const kv = getKV(context);
  const cached = await kv.get(`shop:${shop}:${key}`);
  return cached ? JSON.parse(cached) : null;
}

// Rate limiting
export async function checkRateLimit(
  context: AppLoadContext,
  shop: string,
  limit: number = 100
): Promise<{ allowed: boolean; remaining: number }> {
  const kv = getKV(context);
  const key = `ratelimit:${shop}:${Date.now() / 60000 | 0}`; // per minute
  
  const current = await kv.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  await kv.put(key, String(count + 1), { expirationTtl: 60 });
  return { allowed: true, remaining: limit - count - 1 };
}