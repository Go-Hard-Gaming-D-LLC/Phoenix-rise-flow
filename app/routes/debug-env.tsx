import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getEnv } from "../utils/env.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = getEnv(context);

  const present = (value: unknown) => Boolean(value);

  return json({
    ok: true,
    timestamp: new Date().toISOString(),
    url: request.url,
    env: {
      SHOPIFY_API_KEY: present(env.SHOPIFY_API_KEY),
      SHOPIFY_API_SECRET: present(env.SHOPIFY_API_SECRET),
      SHOPIFY_APP_URL: present(env.SHOPIFY_APP_URL),
      SCOPES: present(env.SCOPES),
      GEMINI_API_KEY: present(env.GEMINI_API_KEY),
      SESSION_KV: present(env.SESSION_KV),
    },
  });
};
