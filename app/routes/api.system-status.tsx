import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    try {
        // 1. Database Integrity Check
        const config = await db.configuration.findUnique({ where: { shop } });
        const historyCount = await db.optimizationHistory.count({ where: { shop } });
        const churnRecord = await db.antiChurn.findUnique({ where: { shop } });

        // 2. Shopify API Handshake Verification
        const shopResponse = await admin.graphql(`#graphql
      query { shop { name plan { displayName } } }
    `);
        const shopData = await shopResponse.json();

        // 3. Clinical Result Aggregation
        return json({
            success: true,
            checks: [
                {
                    label: "Identity Config",
                    status: config ? "PASS" : "MISSING",
                    detail: config ? `Brand: ${config.brandName}` : "Identity not configured in Mission Control."
                },
                {
                    label: "Optimization Ledger",
                    status: historyCount > 0 ? "PASS" : "EMPTY",
                    detail: `${historyCount} verified optimizations in Truth Table.`
                },
                {
                    label: "Subscription Lockdown",
                    status: churnRecord ? "ENFORCED" : "INACTIVE",
                    detail: churnRecord?.lastUninstalled ? `Last uninstall: ${churnRecord.lastUninstalled}` : "No prior churn detected."
                },
                {
                    label: "Shopify API Link",
                    status: shopData.data?.shop ? "ELITE" : "FAIL",
                    detail: `Connected to ${shopData.data?.shop?.name || 'Unknown'}`
                }
            ]
        });
    } catch (error: any) {
        return json({ success: false, error: error.message }, { status: 500 });
    }
};
