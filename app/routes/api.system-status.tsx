/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Central System Heartbeat & Truth Table Verification.
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import { getPrisma } from "../db.server";

export const action = async ({ request, context }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;
    const db = getPrisma(context);

    try {
        // 1. DATABASE INTEGRITY: Verify core Truth Tables
        const config = await db.configuration.findUnique({ where: { shop } });
        const historyCount = await db.optimizationHistory.count({ where: { shop } });
        const churnRecord = await db.antiChurn.findUnique({ where: { shop } });

        // 2. SHOPIFY HANDSHAKE: Live API link verification
        const shopResponse = await admin.graphql(`#graphql
          query checkHeartbeat { 
            shop { 
              name 
              plan { displayName } 
            } 
          }
        `);
        const shopData: any = await shopResponse.json();

        // 3. CLINICAL AGGREGATION: Reporting system vitals
        return json({
            success: true,
            timestamp: new Date().toISOString(),
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
        console.error("[SHADOW_FORGE] Heartbeat Failure:", error.message);
        return json({ success: false, error: error.message }, { status: 500 });
    }
};