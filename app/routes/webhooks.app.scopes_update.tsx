import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendDeveloperAlert } from "../utils/developerAlert";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1. Authenticate the Webhook
  const { payload, topic, shop } = await authenticate.webhook(request);

  console.log(`[Webhook] Received ${topic} for ${shop}`);

  // 2. Parse the New Reality
  const currentScopes = (payload as any).current || [];

  // 3. Check for Critical Skill Loss
  const criticalScopes = ["write_products", "write_files", "write_content"];
  const missingSkills = criticalScopes.filter(scope => !currentScopes.includes(scope));

  try {
    if (missingSkills.length > 0) {
      console.warn(`[Degradation] Shop ${shop} revoked critical scopes: ${missingSkills.join(", ")}`);

      // ✅ FIX: Use 'ERROR' type, but describe the downgrade in the message
      await sendDeveloperAlert(
        "ERROR",
        `[SCOPE DOWNGRADE] Shop ${shop} revoked permissions: ${missingSkills.join(", ")}. AI features are now disabled.`
      );
    }

    // 4. Update ALL sessions for this shop
    await db.session.updateMany({
      where: { shop },
      data: {
        scope: currentScopes.toString()
      },
    });

  } catch (error: any) {
    console.error(`[Webhook Error] Failed to process scope update for ${shop}:`, error);
    return new Response();
  }

  return new Response();
};