import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session } = await authenticate.webhook(request);

  if (session) {
    // 1. Lock the churn data before wiping the session
    await db.antiChurn.upsert({
      where: { shop },
      update: { lastUninstalled: new Date(), trialUsed: true },
      create: { shop, lastUninstalled: new Date(), trialUsed: true }
    });

    // 2. Wipe active session data
    await db.session.deleteMany({ where: { shop } });
  }

  return new Response();
};
