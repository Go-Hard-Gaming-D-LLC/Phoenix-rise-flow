import type { Env } from "../../load-context";

type EnvContext = { cloudflare?: { env: Env } } | { env: Env };

declare global {
  // Set per-request in functions/[[path]].ts for Pages.
  var __CF_ENV: Env | undefined;
}

export function getEnv(context?: EnvContext): Env {
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

export function resolveGeminiApiKey(context?: EnvContext, overrideKey?: string): string {
  if (overrideKey) return overrideKey;
  const env = getEnv(context);
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it as a Cloudflare Secret or wrangler var."
    );
  }
  return env.GEMINI_API_KEY;
}
