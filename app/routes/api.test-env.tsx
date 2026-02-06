import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import { getPrisma } from "../db.server";
import { resolveGeminiApiKey } from "../utils/env.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const db = getPrisma(context);

    // Retrieve Edge Environment
    const apiKey = resolveGeminiApiKey(context);

    // Anti-Churn Logic: 6-Month Lockdown
    const churnRecord = await db.antiChurn.findUnique({ where: { shop } });
    let accessLocked = false;

    if (churnRecord?.lastUninstalled) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        if (churnRecord.lastUninstalled > sixMonthsAgo) {
            accessLocked = true;
        }
    }

    return json({
        apiKey,
        isLocked: accessLocked,
        trialUsed: churnRecord?.trialUsed || false
    });
};
