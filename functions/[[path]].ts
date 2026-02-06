import type { PagesFunction } from "@cloudflare/workers-types";
import type { ServerBuild } from "@remix-run/cloudflare";
import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import { setSessionKv } from "../app/utils/kv-session-storage";
import { getLoadContext, type Env } from "../load-context";

import * as build from "../build/server";

const handleRequest = createPagesFunctionHandler<Env>({
  build: build as unknown as ServerBuild,
  getLoadContext,
  mode: process.env.NODE_ENV,
}) as unknown as PagesFunction<Env>;

export const onRequest: PagesFunction<Env> = (context) => {
  (globalThis as any).__CF_ENV = context.env;
  setSessionKv(context.env.SESSION_KV);
  return handleRequest(context);
};
