// load-context.ts
import type { AppLoadContext } from "@remix-run/cloudflare";
import type { GetLoadContextFunction } from "@remix-run/cloudflare-pages";

export interface Env {
  // Cloudflare KV
  SESSION_KV: KVNamespace;

  // Hyperdrive database binding (optional when using direct DATABASE_URL)
  HYPERDRIVE?: { connectionString: string };

  // Direct database URL (e.g., Supabase Postgres)
  DATABASE_URL?: string;

  // Environment Variables
  GEMINI_API_KEY: string;
  SHOPIFY_API_KEY: string;
  SHOPIFY_API_SECRET: string;
  SHOPIFY_APP_URL: string;
  SCOPES: string;
}

type Cloudflare = { env: Env } & Record<string, any>;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}

export const getLoadContext: GetLoadContextFunction<Env> = ({ context }) => {
  return {
    ...context,
    cloudflare: context.cloudflare,
  } as AppLoadContext;
};
