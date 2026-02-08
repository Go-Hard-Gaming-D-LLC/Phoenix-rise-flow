import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { getEnv } from "../utils/env.server";

export const loader = ({ context }: LoaderFunctionArgs) => {
  const env = getEnv(context);
  const isEmbedded = env.EMBEDDED !== "false";
  return redirect(isEmbedded ? "/app" : "/studio");
};
