import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    // Retrieve Edge Environment
    const env = (context as any).cloudflare?.env || (context as any).env || process.env;

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
        apiKey: env.GEMINI_API_KEY || "",
        isLocked: accessLocked,
        trialUsed: churnRecord?.trialUsed || false
    });
};
